from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from math import sin, cos, acos, pi
from pathlib import Path
from typing import Dict, Any, List, Optional

import httpx
import joblib
import json
import numpy as np
import xgboost as xgb

app = FastAPI(title="SolWindX API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent

# Load city assignments
CITY_ASSIGNMENTS: Dict[str, Any] = {}
city_file = BASE_DIR / "city_mapping.json"

try:
    with open(city_file, "r", encoding="utf-8") as f:
        CITY_ASSIGNMENTS = json.load(f)
    print(f"✅ Loaded {len(CITY_ASSIGNMENTS)} city assignments")
except Exception as e:
    print(f"❌ Failed to load city_assignments.json: {e}")

# XGBoost wrapper
class XGBBoosterWrapper:
    def __init__(self, booster: xgb.Booster):
        self.booster = booster

    def predict(self, X):
        dmat = xgb.DMatrix(X)
        return self.booster.predict(dmat)

# Load models
MODELS: Dict[str, Any] = {}
SCALERS: Dict[str, Any] = {}

def load_model_for(name: str):
    folder1 = BASE_DIR.parent / "models" / name
    folder2 = BASE_DIR / "models" / name

    if (folder1 / "xgb_model.json").exists():
        folder = folder1
    elif (folder2 / "xgb_model.json").exists():
        folder = folder2
    else:
        raise FileNotFoundError(f"xgb_model.json not found for '{name}'")

    model_json_path = folder / "xgb_model.json"
    scaler_path = folder / "scaler.pkl"

    booster = xgb.Booster()
    booster.load_model(str(model_json_path))
    model = XGBBoosterWrapper(booster)

    if not scaler_path.exists():
        raise FileNotFoundError(f"Scaler file not found for '{name}'")
    scaler = joblib.load(scaler_path)

    print(f"✅ Loaded model and scaler for '{name}'")
    return model, scaler

# Pre-load models
if CITY_ASSIGNMENTS:
    model_names = sorted({info["model"] for info in CITY_ASSIGNMENTS.values()})
    for name in model_names:
        try:
            m, s = load_model_for(name)
            MODELS[name] = m
            SCALERS[name] = s
        except Exception as e:
            print(f"❌ Failed to load model '{name}': {e}")

# Pydantic models
class PredictionRequest(BaseModel):
    city: str
    area: float
    efficiency: Optional[float] = 0.18
    mode: Optional[str] = "realtime"
    num_turbines: Optional[int] = 1
    rotor_diameter: Optional[float] = 80

class WeatherData(BaseModel):
    temperature: float
    wind_speed: float
    condition: str

class ForecastDay(BaseModel):
    day: int
    energy_total: float
    energy_per_m2: float
    timestamp: str

class PredictionResponse(BaseModel):
    city: str
    lat: float
    lon: float
    assigned_model: str
    weather: WeatherData
    energy_per_m2: float
    energy_total: float
    forecast_data: Optional[List[ForecastDay]] = None

# Solar elevation calculation
def compute_solar_elevation(lat_deg: float, lon_deg: float, dt_utc: datetime) -> float:
    doy = dt_utc.timetuple().tm_yday
    hour = dt_utc.hour + dt_utc.minute / 60 + dt_utc.second / 3600

    gamma = 2.0 * pi / 365.0 * (doy - 1 + (hour - 12.0) / 24.0)

    eqtime = 229.18 * (
        0.000075
        + 0.001868 * cos(gamma)
        - 0.032077 * sin(gamma)
        - 0.014615 * cos(2 * gamma)
        - 0.040849 * sin(2 * gamma)
    )

    decl = (
        0.006918
        - 0.399912 * cos(gamma)
        + 0.070257 * sin(gamma)
        - 0.006758 * cos(2 * gamma)
        + 0.000907 * sin(2 * gamma)
        - 0.002697 * cos(3 * gamma)
        + 0.00148 * sin(3 * gamma)
    )

    time_offset = eqtime + 4.0 * lon_deg
    tst = hour * 60.0 + time_offset
    ha = (tst / 4.0 - 180.0) * pi / 180.0
    lat_rad = lat_deg * pi / 180.0

    cos_zenith = (
        sin(lat_rad) * sin(decl) +
        cos(lat_rad) * cos(decl) * cos(ha)
    )
    cos_zenith = max(min(cos_zenith, 1.0), -1.0)
    zenith = acos(cos_zenith)

    elev = 90.0 - zenith * 180.0 / pi
    return elev

def parse_openmeteo_time(time_str: str) -> datetime:
    dt = datetime.fromisoformat(time_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def prepare_features(hourly: dict, lat: float, lon: float, index: int = 0):
    try:
        poa_direct = float(hourly["direct_radiation"][index])
        poa_diffuse = float(hourly["diffuse_radiation"][index])
        temperature = float(hourly["temperature_2m"][index])
        wind_speed = float(hourly["wind_speed_10m"][index])
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=502, detail=f"Incomplete weather data: {e}")

    albedo = 0.2
    poa_ground_reflected = (poa_direct + poa_diffuse) * albedo

    if "time" in hourly:
        time_str = hourly["time"][index]
        dt_utc = parse_openmeteo_time(time_str)
    else:
        dt_utc = datetime.now(timezone.utc)

    solar_elev = compute_solar_elevation(lat, lon, dt_utc)

    features = np.array([[
        poa_ground_reflected,
        solar_elev,
        temperature,
        wind_speed,
        lat,
        lon,
    ]])

    return features, temperature, wind_speed, solar_elev, poa_direct

# Endpoints
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "cities_available": len(CITY_ASSIGNMENTS),
        "models_loaded": list(MODELS.keys()),
    }

@app.get("/cities")
async def get_cities():
    if not CITY_ASSIGNMENTS:
        raise HTTPException(status_code=500, detail="City assignments not loaded.")
    return {"count": len(CITY_ASSIGNMENTS), "cities": sorted(CITY_ASSIGNMENTS.keys())}

@app.post("/predict-energy", response_model=PredictionResponse)
async def predict_energy(request: PredictionRequest):
    # 1. Validate city
    city_info = CITY_ASSIGNMENTS.get(request.city)
    if not city_info:
        raise HTTPException(status_code=404, detail="City not found")

    if request.area <= 0:
        raise HTTPException(status_code=400, detail="Area must be > 0")

    lat = float(city_info["lat"])
    lon = float(city_info["lon"])
    assigned_model = city_info["model"]

    # 2. Get preloaded model & scaler
    model = MODELS.get(assigned_model)
    scaler = SCALERS.get(assigned_model)
    if model is None or scaler is None:
        raise HTTPException(
            status_code=500,
            detail=f"Model/scaler for '{assigned_model}' not loaded on server"
        )

    # 3. Determine forecast days based on mode
    if request.mode == "7day":
        forecast_days = 7
    elif request.mode == "monthly":
        forecast_days = 16  # Use 16 days for Open-Meteo free tier
    else:  # realtime or wind
        forecast_days = 1

    # 4. Fetch weather with forecast_days parameter
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "direct_radiation,diffuse_radiation,shortwave_radiation,temperature_2m,wind_speed_10m",
        "timezone": "auto",
        "forecast_days": forecast_days,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=503, detail="Weather API error")
        weather = resp.json()

    if "hourly" not in weather:
        raise HTTPException(status_code=502, detail="Weather API response missing 'hourly'")

    hourly = weather["hourly"]

    # 5. Process forecast
    forecast_data = []
    
    if request.mode in ["7day", "monthly"]:
        # Group by day and calculate daily totals
        hours_per_day = 24
        num_days = min(forecast_days, len(hourly["time"]) // hours_per_day)
        
        print(f"Processing {request.mode} forecast: {num_days} days, {len(hourly['time'])} hours available")
        
        for day_idx in range(num_days):
            daily_energy = 0
            valid_predictions = 0
            
            for hour_idx in range(hours_per_day):
                idx = day_idx * hours_per_day + hour_idx
                if idx >= len(hourly["time"]):
                    break
                
                try:
                    features, _, _, _, poa_direct = prepare_features(hourly, lat, lon, idx)
                    
                    # Only predict during daylight (when there's meaningful solar radiation)
                    if poa_direct > 10:
                        features_scaled = scaler.transform(features)
                        P = float(model.predict(features_scaled)[0])
                        
                        # Ensure P is positive and reasonable
                        P = max(0, P)
                        
                        # Energy in kWh for this hour
                        energy_hour = (P * request.efficiency) / 1000.0
                        daily_energy += energy_hour
                        valid_predictions += 1
                except Exception as e:
                    print(f"Error processing hour {idx}: {e}")
                    continue
            
            # Only add day if we have at least some predictions
            if valid_predictions > 0:
                energy_per_m2 = daily_energy
                energy_total = energy_per_m2 * request.area
                
                forecast_data.append(ForecastDay(
                    day=day_idx + 1,
                    energy_total=round(energy_total, 2),
                    energy_per_m2=round(energy_per_m2, 4),
                    timestamp=hourly["time"][day_idx * hours_per_day]
                ))
                
                print(f"Day {day_idx + 1}: {energy_total:.2f} kWh (from {valid_predictions} hours)")
        
        print(f"Generated {len(forecast_data)} forecast days")
    
    # 6. Get current/first prediction for main response
    features, temperature, wind_speed, solar_elev, poa_direct = prepare_features(
        hourly, lat=lat, lon=lon, index=0
    )
    
    features_scaled = scaler.transform(features)
    P = float(model.predict(features_scaled)[0])
    P = max(0, P)  # Ensure positive

    # Calculate energy (P is predicted irradiance in W/m²)
    # Energy per m² for current hour in kWh
    energy_per_m2 = (P * request.efficiency) / 1000.0
    energy_total = energy_per_m2 * request.area

    condition = "Clear" if poa_direct > 500 else "Cloudy"

    return PredictionResponse(
        city=request.city,
        lat=lat,
        lon=lon,
        assigned_model=assigned_model,
        weather=WeatherData(
            temperature=temperature,
            wind_speed=wind_speed,
            condition=condition,
        ),
        energy_per_m2=round(energy_per_m2, 4),
        energy_total=round(energy_total, 2),
        forecast_data=forecast_data if forecast_data else None
    )