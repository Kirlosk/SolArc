# generate_city_hourly_timestamps.py
# Paste into Jupyter or run with python.
import pandas as pd
import os
import sys

# Optional: progress bar
try:
    from tqdm import tqdm
except Exception:
    tqdm = lambda x, **k: x  # fallback

# -------------------------
# CONFIG - update if needed
# -------------------------
input_path = "D:/AI_RES_models/karnataka_data.csv"   # <-- local path provided earlier
output_path = "D:/AI_RES_models/karnataka_data_time.csv"
start_datetime = pd.Timestamp("2005-01-01 06:00:00")  # starting timestamp for each city
timestamp_freq = "H"  # hourly

# -------------------------
# Basic checks
# -------------------------
if not os.path.exists(input_path):
    raise FileNotFoundError(f"Input file not found: {input_path}")

print("Loading input CSV (this may take some time for large files)...")
# Read full CSV (we need City grouping). If very large, consider reading selected columns first.
df = pd.read_csv(input_path)

print(f"Loaded file with {len(df):,} rows and columns: {list(df.columns)}")

# detect city column (case-insensitive)
city_col = None
for c in df.columns:
    if c.lower() == "city":
        city_col = c
        break
if city_col is None:
    # fallback: look for column name containing 'city'
    for c in df.columns:
        if "city" in c.lower():
            city_col = c
            break

if city_col is None:
    raise ValueError("Could not find a 'City' column in the CSV. Rename the city column to 'City' or modify the script.")

print(f"Using city column: '{city_col}'")

# ensure the city column is string and strip whitespace
df[city_col] = df[city_col].astype(str).str.strip()

# prepare output DataFrame in chunks per city to avoid memory surge
cities = df[city_col].unique()
print(f"Found {len(cities)} unique cities. Example: {cities[:5]}")

# If output exists, remove it (we will recreate)
if os.path.exists(output_path):
    print(f"Output file {output_path} exists — it will be overwritten.")
    os.remove(output_path)

# We'll write header on first write
first_write = True
rows_written = 0

print("\nStarting per-city timestamp assignment...")
for city in tqdm(cities, desc="cities"):
    # get mask for this city (preserves original row order for that city)
    mask = df[city_col] == city
    df_city = df.loc[mask].copy()
    n = len(df_city)
    if n == 0:
        continue

    # generate timestamps for this city
    # safe to use date_range here because n is expected to be ~1e5 level per city (no overflow)
    timestamps = pd.date_range(start=start_datetime, periods=n, freq=timestamp_freq)

    # assign timestamps (as naive timestamps without tz). If you want timezone-aware, use tz_localize.
    df_city['assigned_timestamp'] = timestamps

    # append to output CSV (write header only once)
    if first_write:
        df_city.to_csv(output_path, index=False)
        first_write = False
    else:
        df_city.to_csv(output_path, mode='a', header=False, index=False)

    rows_written += n

print(f"\nFinished. Total rows written: {rows_written:,}")
print(f"Output saved to: {output_path}")

# quick verification: show sample
print("\nSample of first 20 rows in output:")
out_df = pd.read_csv(output_path, nrows=20)
print(out_df[['assigned_timestamp', city_col]].to_string(index=True))
