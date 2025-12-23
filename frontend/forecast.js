// ===========================
// Global State
// ===========================
const API_BASE = 'http://localhost:8000';
let allCities = [];
let selectedCity = null;
let currentMode = null;
let forecastChart = null;

// ===========================
// Generate Star Shadows for Forecast Page
// ===========================
function generateStars(count) {
    let shadows = [];
    for (let i = 0; i < count; i++) {
        shadows.push(`${Math.random() * 2000}px ${Math.random() * 2000}px #FFF`);
    }
    return shadows.join(', ');
}

const stars1 = document.getElementById('stars');
const stars2 = document.getElementById('stars2');
const stars3 = document.getElementById('stars3');

if (stars1) stars1.style.boxShadow = generateStars(700);
if (stars2) stars2.style.boxShadow = generateStars(200);
if (stars3) stars3.style.boxShadow = generateStars(100);

// ===========================
// Fetch Cities from Backend
// ===========================
async function fetchCities() {
    try {
        const response = await fetch(`${API_BASE}/cities`);
        if (!response.ok) throw new Error('Failed to fetch cities');
        
        const data = await response.json();
        allCities = data.cities.map(cityName => ({
            name: cityName,
            model: assignModelToCity(cityName),
            lat: 0,
            lon: 0
        }));
        
        console.log('Fetched cities:', allCities.length);
        displayFeaturedCities();
    } catch (error) {
        console.error('Error fetching cities:', error);
        showToast('Error loading cities. Using fallback list.');
        loadFallbackCities();
    }
}

function loadFallbackCities() {
    const fallbackList = [
        'Bengaluru', 'Hassan', 'Karwar', 'Mysuru', 'Mangaluru',
        'Hubballi', 'Belagavi', 'Davanagere', 'Bidar'
    ];
    
    allCities = fallbackList.map(city => ({
        name: city,
        model: assignModelToCity(city),
        lat: 0,
        lon: 0
    }));
    
    displayFeaturedCities();
}

function assignModelToCity(cityName) {
    const coastal = ['Karwar', 'Mangaluru', 'Udupi', 'Bhatkal', 'Kundapur'];
    const urban = ['Bengaluru', 'Bangalore', 'Mysuru', 'Hubballi'];
    
    if (coastal.some(c => cityName.includes(c))) return 'Karwar';
    if (urban.some(c => cityName.includes(c))) return 'Bengaluru';
    return 'Hassan';
}

// ===========================
// Display Featured Cities - FIXED
// ===========================
function displayFeaturedCities() {
    const grid = document.getElementById('cityCardsGrid');
    grid.innerHTML = '';
    
    // Filter to show only these cities
    const allowedCities = ['Bengaluru', 'Hassan', 'Karwar', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Davanagere', 'Bidar'];
    
    let featured = allCities.filter(city => {
        const cityName = city.name || city;
        return allowedCities.includes(cityName);
    });
    
    // If no cities match (API not loaded yet), create fallback
    if (featured.length === 0) {
        featured = allowedCities.map(name => ({
            name: name,
            model: assignModelToCity(name)
        }));
    }
    
    console.log('Displaying cities:', featured.length);
    
    featured.forEach((city, index) => {
        const card = document.createElement('div');
        card.className = 'city-card';
        card.innerHTML = `<div class="city-card-name">${city.name || city}</div>`;
        
        card.addEventListener('click', () => selectCity(city, card));
        grid.appendChild(card);
        
        card.style.opacity = '0';
        anime({
            targets: card,
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 600,
            delay: index * 80,
            easing: 'easeOutCubic'
        });
    });
}

// ===========================
// City Search with Dropdown - FIXED
// ===========================
const searchInput = document.getElementById('citySearch');
const searchDropdown = document.getElementById('searchDropdown');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm.length === 0) {
        searchDropdown.style.display = 'none';
        return;
    }
    
    // Filter from all cities
    const filtered = allCities.filter(city => {
        const name = (city.name || city).toLowerCase();
        return name.includes(searchTerm);
    });
    
    console.log('Filtered cities:', filtered.length);
    
    if (filtered.length > 0) {
        showDropdown(filtered.slice(0, 10));
    } else {
        searchDropdown.style.display = 'none';
    }
});

function showDropdown(cities) {
    searchDropdown.innerHTML = '';
    searchDropdown.style.display = 'block';
    
    cities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.textContent = city.name || city;
        
        item.addEventListener('click', () => {
            const cityName = city.name || city;
            searchInput.value = cityName;
            searchDropdown.style.display = 'none';
            
            // Deselect all cards
            document.querySelectorAll('.city-card').forEach(c => c.classList.remove('selected'));
            
            // Set selected city
            selectedCity = city;
            console.log('Selected from dropdown:', selectedCity);
            
            // Try to find and select corresponding card
            const cards = document.querySelectorAll('.city-card');
            cards.forEach(card => {
                if (card.textContent.trim() === cityName) {
                    card.classList.add('selected');
                }
            });
        });
        
        searchDropdown.appendChild(item);
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchDropdown.style.display = 'none';
    }
});

// ===========================
// Select City
// ===========================
function selectCity(city, cardElement) {
    document.querySelectorAll('.city-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    selectedCity = city;
    
    anime({
        targets: cardElement,
        scale: [1, 1.05, 1],
        duration: 300,
        easing: 'easeInOutQuad'
    });
    
    console.log('Selected city:', selectedCity);
}

// ===========================
// Mode Selector with Animations
// ===========================
const modeOptions = document.querySelectorAll('.mode-option');

modeOptions.forEach((option, index) => {
    anime({
        targets: option,
        opacity: [0.7, 1, 0.7],
        duration: 1500,
        delay: index * 300,
        loop: true,
        easing: 'easeInOutCubic'
    });
    
    option.addEventListener('mouseenter', function() {
        anime({
            targets: this,
            scale: 1.15,
            duration: 250,
            easing: 'easeOutQuad'
        });
    });
    
    option.addEventListener('mouseleave', function() {
        anime({
            targets: this,
            scale: 1,
            duration: 750,
            easing: 'easeOutQuad'
        });
    });
    
    option.addEventListener('click', function() {
        const mode = this.getAttribute('data-mode');
        selectMode(mode, this);
    });
});

// ===========================
// Select Mode and Trigger Prediction
// ===========================
async function selectMode(mode, element) {
    if (!selectedCity) {
        showToast('Please select a city first');
        return;
    }
    
    const panelArea = parseFloat(document.getElementById('panelArea').value);
    if (!panelArea || panelArea <= 0) {
        showToast('Please enter a valid panel area');
        return;
    }
    
    modeOptions.forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    currentMode = mode;
    
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';
    
    anime({
        targets: 'html, body',
        scrollTop: resultsSection.offsetTop - 100,
        duration: 1000,
        easing: 'easeInOutQuad'
    });
    
    anime({
        targets: '.results-section',
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 800,
        easing: 'easeOutCubic'
    });
    
    try {
        if (mode === 'realtime') {
            await fetchRealtimeForecast();
        } else if (mode === '7day') {
            await fetchWeeklyForecast();
        } else if (mode === 'monthly') {
            await fetchMonthlyForecast();
        } else if (mode === 'wind') {
            await fetchWindForecast();
        }
    } catch (error) {
        console.error('Prediction error:', error);
        showToast('Error fetching predictions. Please try again.');
    }
}

// ===========================
// Fetch Realtime Forecast
// ===========================
async function fetchRealtimeForecast() {
    const cityName = selectedCity.name || selectedCity;
    const area = parseFloat(document.getElementById('panelArea').value);
    const efficiencyPercent = parseFloat(document.getElementById('panelEfficiency').value) || 18;
    const efficiency = efficiencyPercent / 100;
    
    try {
        const response = await fetch(`${API_BASE}/predict-energy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: cityName,
                area: area,
                efficiency: efficiency,
                mode: 'realtime'
            })
        });
        
        if (!response.ok) throw new Error('Realtime prediction failed');
        const data = await response.json();
        
        updateMapWindow(data);
        renderRealtimeResults(data, area);
        
        document.getElementById('chartContainer').style.display = 'none';
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch realtime data');
    }
}

// ===========================
// Fetch 7-Day Forecast - FIXED
// ===========================
async function fetchWeeklyForecast() {
    const cityName = selectedCity.name || selectedCity;
    const area = parseFloat(document.getElementById('panelArea').value);
    const efficiency = parseFloat(document.getElementById('panelEfficiency').value) || 0.18;
    
    try {
        const response = await fetch(`${API_BASE}/predict-energy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: cityName,
                area: area,
                efficiency: efficiency,
                mode: '7day'
            })
        });
        
        if (!response.ok) throw new Error('7-day forecast failed');
        const data = await response.json();
        
        updateMapWindow(data);
        renderWeeklyChart(data);
        
        const container = document.getElementById('resultCardsContainer');
        container.innerHTML = '';
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch 7-day forecast');
    }
}

// ===========================
// Fetch Monthly Forecast - FIXED
// ===========================
async function fetchMonthlyForecast() {
    const cityName = selectedCity.name || selectedCity;
    const area = parseFloat(document.getElementById('panelArea').value);
    const efficiency = parseFloat(document.getElementById('panelEfficiency').value) || 0.18;
    
    try {
        const response = await fetch(`${API_BASE}/predict-energy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: cityName,
                area: area,
                efficiency: efficiency,
                mode: 'monthly'
            })
        });
        
        if (!response.ok) throw new Error('Monthly forecast failed');
        const data = await response.json();
        
        updateMapWindow(data);
        renderMonthlyResults(data);
        renderMonthlyChart(data);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch monthly predictions');
    }
}

// ===========================
// Fetch Wind Forecast
// ===========================
async function fetchWindForecast() {
    const cityName = selectedCity.name || selectedCity;
    const numWindmills = parseInt(document.getElementById('numWindmills').value) || 1;
    const rotorDiameter = parseFloat(document.getElementById('rotorDiameter').value) || 80;
    const rotorArea = Math.PI * Math.pow(rotorDiameter / 2, 2);
    
    try {
        const response = await fetch(`${API_BASE}/predict-energy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                city: cityName,
                area: rotorArea * numWindmills,
                num_turbines: numWindmills,
                rotor_diameter: rotorDiameter,
                mode: 'wind'
            })
        });
        
        if (!response.ok) throw new Error('Wind prediction failed');
        const data = await response.json();
        
        updateMapWindow(data);
        renderWindResults(data, rotorArea, numWindmills);
        
        document.getElementById('chartContainer').style.display = 'none';
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch wind predictions');
    }
}

// ===========================
// Update Map Window
// ===========================
function updateMapWindow(data) {
    const mapIframe = document.getElementById('mapIframe');
    const mapCityName = document.getElementById('mapCityName');
    const mapCoords = document.getElementById('mapCoords');
    
    const lat = data.lat;
    const lon = data.lon;
    
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.1},${lat-0.1},${lon+0.1},${lat+0.1}&layer=mapnik&marker=${lat},${lon}`;
    mapIframe.src = mapUrl;
    
    mapCityName.textContent = data.city;
    mapCoords.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// ===========================
// Render Realtime Results - FIXED
// ===========================
function renderRealtimeResults(data, area) {
    const container = document.getElementById('resultCardsContainer');
    container.innerHTML = '';
    
    const energyCard = document.createElement('div');
    energyCard.className = 'result-card glass-panel';
    energyCard.innerHTML = `
        <h3 class="result-card-title">⚡ Energy Output</h3>
        <div class="result-item">
            <span class="result-label">Energy per m²</span>
            <span class="result-value highlight">${data.energy_per_m2.toFixed(4)} kWh/m²</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total Energy (${area} m²)</span>
            <span class="result-value highlight">${data.energy_total.toFixed(2)} kWh</span>
        </div>
    `;
    
    const weatherCard = document.createElement('div');
    weatherCard.className = 'result-card glass-panel';
    weatherCard.innerHTML = `
        <h3 class="result-card-title">🌤️ Weather Conditions</h3>
        <div class="result-item">
            <span class="result-label">Temperature</span>
            <span class="result-value">${data.weather.temperature.toFixed(1)}°C</span>
        </div>
        <div class="result-item">
            <span class="result-label">Wind Speed</span>
            <span class="result-value">${data.weather.wind_speed.toFixed(1)} m/s</span>
        </div>
        <div class="result-item">
            <span class="result-label">Condition</span>
            <span class="result-value">${data.weather.condition}</span>
        </div>
    `;
    
    const systemCard = document.createElement('div');
    systemCard.className = 'result-card glass-panel';
    systemCard.innerHTML = `
        <h3 class="result-card-title">📊 System Info</h3>
        <div class="result-item">
            <span class="result-label">Model</span>
            <span class="result-value">${data.assigned_model}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Location</span>
            <span class="result-value">${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}</span>
        </div>
    `;
    
    container.appendChild(energyCard);
    container.appendChild(weatherCard);
    container.appendChild(systemCard);
    
    anime({
        targets: '.result-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(150),
        easing: 'easeOutCubic'
    });
}

// ===========================
// Render Weekly Chart - FIXED
// ===========================
function renderWeeklyChart(data) {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.style.display = 'block';
    
    document.getElementById('chartTitle').textContent = '7-Day Energy Forecast';
    
    if (forecastChart) {
        forecastChart.destroy();
    }
    
    const labels = data.forecast_data.map(d => `Day ${d.day}`);
    const energyData = data.forecast_data.map(d => d.energy_total);
    
    // Find peak value
    const peakValue = Math.max(...energyData);
    const peakDay = energyData.indexOf(peakValue) + 1;
    
    const ctx = document.getElementById('forecastChart').getContext('2d');
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Energy Output (kWh)',
                data: energyData,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: energyData.map((val, idx) => 
                    val === peakValue ? '#ffff00' : '#00d4ff'
                ),
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.9)',
                    titleColor: '#00d4ff',
                    bodyColor: '#ffffff',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.parsed.y === peakValue) {
                                return '⭐ Peak Day';
                            }
                            return '';
                        }
                    }
                },
                datalabels: {
                    color: '#ffffff',
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    formatter: function(value, context) {
                        // Show value on all points
                        const suffix = value === peakValue ? ' ⭐' : '';
                        return value.toFixed(1) + suffix;
                    },
                    backgroundColor: function(context) {
                        return context.dataset.data[context.dataIndex] === peakValue 
                            ? 'rgba(255, 255, 0, 0.2)' 
                            : 'rgba(0, 0, 0, 0.5)';
                    },
                    borderRadius: 4,
                    padding: 4
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#9ca3af',
                        callback: function(value) {
                            return value.toLocaleString() + ' kWh';
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
    
    // Add peak info banner
    const container = document.getElementById('resultCardsContainer');
    container.innerHTML = `
        <div class="result-card glass-panel">
            <h3 class="result-card-title">📊 7-Day Summary</h3>
            <div class="result-item">
                <span class="result-label">Peak Day</span>
                <span class="result-value highlight">Day ${peakDay}: ${peakValue.toFixed(2)} kWh ⭐</span>
            </div>
            <div class="result-item">
                <span class="result-label">Average Daily</span>
                <span class="result-value">${(energyData.reduce((a,b) => a+b, 0) / energyData.length).toFixed(2)} kWh</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Week</span>
                <span class="result-value">${energyData.reduce((a,b) => a+b, 0).toFixed(2)} kWh</span>
            </div>
        </div>
    `;
    
    anime({
        targets: '.result-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        easing: 'easeOutCubic'
    });
}

// ===========================
// Render Monthly Results - FIXED
// ===========================
function renderMonthlyResults(data) {
    const container = document.getElementById('resultCardsContainer');
    container.innerHTML = '';
    
    // Check if forecast_data exists
    if (!data.forecast_data || data.forecast_data.length === 0) {
        container.innerHTML = `
            <div class="result-card glass-panel">
                <h3 class="result-card-title">⚠️ No Data</h3>
                <p style="color: var(--text-secondary);">Unable to generate monthly forecast. Please try again.</p>
            </div>
        `;
        return;
    }
    
    // Calculate monthly statistics
    const totalEnergy = data.forecast_data.reduce((sum, day) => sum + day.energy_total, 0);
    const avgDaily = totalEnergy / data.forecast_data.length;
    const maxDay = data.forecast_data.reduce((max, day) => day.energy_total > max.energy_total ? day : max);
    const minDay = data.forecast_data.reduce((min, day) => day.energy_total < min.energy_total ? day : min);
    
    // Monthly Summary Card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'result-card glass-panel';
    summaryCard.innerHTML = `
        <h3 class="result-card-title">📅 Monthly Summary (${data.forecast_data.length} days)</h3>
        <div class="result-item">
            <span class="result-label">Total Energy</span>
            <span class="result-value highlight">${totalEnergy.toFixed(2)} kWh</span>
        </div>
        <div class="result-item">
            <span class="result-label">Average Daily</span>
            <span class="result-value">${avgDaily.toFixed(2)} kWh/day</span>
        </div>
        <div class="result-item">
            <span class="result-label">Peak Day ⭐</span>
            <span class="result-value">Day ${maxDay.day}: ${maxDay.energy_total.toFixed(2)} kWh</span>
        </div>
        <div class="result-item">
            <span class="result-label">Lowest Day</span>
            <span class="result-value">Day ${minDay.day}: ${minDay.energy_total.toFixed(2)} kWh</span>
        </div>
    `;
    
    container.appendChild(summaryCard);
    
    anime({
        targets: '.result-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        easing: 'easeOutCubic'
    });
}

// ===========================
// Render Monthly Chart - FIXED
// ===========================
function renderMonthlyChart(data) {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.style.display = 'block';
    
    document.getElementById('chartTitle').textContent = '30-Day Energy Forecast';
    
    if (forecastChart) {
        forecastChart.destroy();
    }
    
    const labels = data.forecast_data.map(d => `D${d.day}`);
    const energyData = data.forecast_data.map(d => d.energy_total);
    
    // Find peak value
    const peakValue = Math.max(...energyData);
    const peakDay = energyData.indexOf(peakValue) + 1;
    
    const ctx = document.getElementById('forecastChart').getContext('2d');
    forecastChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Energy Output (kWh)',
                data: energyData,
                backgroundColor: energyData.map(val => 
                    val === peakValue ? 'rgba(255, 215, 0, 0.8)' : 'rgba(139, 92, 246, 0.6)'
                ),
                borderColor: energyData.map(val => 
                    val === peakValue ? '#ffd700' : '#8b5cf6'
                ),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.9)',
                    titleColor: '#8b5cf6',
                    bodyColor: '#ffffff',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.parsed.y === peakValue) {
                                return '⭐ Peak Day';
                            }
                            return '';
                        }
                    }
                },
                datalabels: {
                    color: '#ffffff',
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    font: {
                        size: 9,
                        weight: 'bold'
                    },
                    formatter: function(value, context) {
                        // Only show labels for peak and every 5th day
                        if (value === peakValue) {
                            return value.toFixed(0) + '⭐';
                        } else if (context.dataIndex % 5 === 0) {
                            return value.toFixed(0);
                        }
                        return '';
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 3,
                    padding: 2
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#9ca3af',
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { 
                        color: '#9ca3af',
                        maxRotation: 0,
                        minRotation: 0,
                        font: {
                            size: 9
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// ===========================
// Render Wind Results
// ===========================
function renderWindResults(data, rotorArea, numWindmills) {
    const container = document.getElementById('resultCardsContainer');
    container.innerHTML = '';
    
    const energyCard = document.createElement('div');
    energyCard.className = 'result-card glass-panel';
    energyCard.innerHTML = `
        <h3 class="result-card-title">💨 Wind Energy Output</h3>
        <div class="result-item">
            <span class="result-label">Energy per Turbine</span>
            <span class="result-value highlight">${(data.energy_total / numWindmills).toFixed(2)} kWh</span>
        </div>
        <div class="result-item">
            <span class="result-label">Total Energy (${numWindmills} turbines)</span>
            <span class="result-value highlight">${data.energy_total.toFixed(2)} kWh</span>
        </div>
    `;
    
    const windCard = document.createElement('div');
    windCard.className = 'result-card glass-panel';
    windCard.innerHTML = `
        <h3 class="result-card-title">🌬️ Wind Conditions</h3>
        <div class="result-item">
            <span class="result-label">Wind Speed</span>
            <span class="result-value">${data.weather.wind_speed.toFixed(1)} m/s</span>
        </div>
        <div class="result-item">
            <span class="result-label">Temperature</span>
            <span class="result-value">${data.weather.temperature.toFixed(1)}°C</span>
        </div>
        <div class="result-item">
            <span class="result-label">Condition</span>
            <span class="result-value">${data.weather.condition}</span>
        </div>
    `;
    
    const specsCard = document.createElement('div');
    specsCard.className = 'result-card glass-panel';
    specsCard.innerHTML = `
        <h3 class="result-card-title">⚙️ Turbine Specifications</h3>
        <div class="result-item">
            <span class="result-label">Number of Turbines</span>
            <span class="result-value">${numWindmills}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Rotor Area (per turbine)</span>
            <span class="result-value">${rotorArea.toFixed(2)} m²</span>
        </div>
        <div class="result-item">
            <span class="result-label">Model Used</span>
            <span class="result-value">${data.assigned_model}</span>
        </div>
    `;
    
    container.appendChild(energyCard);
    container.appendChild(windCard);
    container.appendChild(specsCard);
    
    anime({
        targets: '.result-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(150),
        easing: 'easeOutCubic'
    });
}

// ===========================
// Toast Notification
// ===========================
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===========================
// Initialize on Page Load
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Forecast page loaded');
    fetchCities();
});
window.addEventListener('scroll', () => {
    const logo = document.querySelector('.solcast-logo');
    if (logo) {
        const scrolled = window.scrollY;
        const opacity = Math.max(0, 1 - (scrolled / 500));
        logo.style.opacity = opacity;
    }
});