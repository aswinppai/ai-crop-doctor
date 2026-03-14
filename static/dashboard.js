// Replace with your own OpenWeatherMap API key
const API_KEY = "71ff32196d52721387b0afb62ed1c910";

// Basic weather icon mapping for FontAwesome
const weatherIcons = {
    'Clear': '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>',
    'Clouds': '<i class="fa-solid fa-cloud" style="color: #94a3b8;"></i>',
    'Rain': '<i class="fa-solid fa-cloud-rain" style="color: #3b82f6;"></i>',
    'Drizzle': '<i class="fa-solid fa-cloud-rain" style="color: #60a5fa;"></i>',
    'Thunderstorm': '<i class="fa-solid fa-cloud-bolt" style="color: #8b5cf6;"></i>',
    'Snow': '<i class="fa-solid fa-snowflake" style="color: #e0f2fe;"></i>',
    'Mist': '<i class="fa-solid fa-smog" style="color: #cbd5e1;"></i>',
    'Haze': '<i class="fa-solid fa-smog" style="color: #cbd5e1;"></i>',
    'Fog': '<i class="fa-solid fa-smog" style="color: #cbd5e1;"></i>'
};

document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const location = document.getElementById("location").value;
    const cropRaw = document.getElementById("crop").value;
    const crop = cropRaw ? cropRaw.trim().charAt(0).toUpperCase() + cropRaw.trim().slice(1).toLowerCase() : "Unknown";
    const loader = document.getElementById("loader");
    const forecastContainer = document.getElementById("forecast");
    const dashboardContent = document.getElementById("resultsDashboard");

    if (!location) {
        alert("Please enter a location.");
        return;
    }

    // Show Loader
    loader.classList.add("active");

    try {
        // Fetch current weather data
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`
        );

        if (!weatherResponse.ok) {
            throw new Error('City not found or API error');
        }

        const weatherData = await weatherResponse.json();

        // Fallback robust Openweather API fetch
        let forecastDays = [];
        try {
            const { lat, lon } = weatherData.coord;
            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${API_KEY}&units=metric`
            );
            if (forecastResponse.ok) {
                const fData = await forecastResponse.json();
                forecastDays = fData.daily;
            } else {
                throw new Error("OneCall failed");
            }
        } catch (e) {
            // Fallback to 5 day/3 hour forecast if OneCall is unauthorized
            const fallbackResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric`
            );
            const fallbackData = await fallbackResponse.json();

            // Extract roughly daily data (every 8th item is 24 hours apart)
            forecastDays = fallbackData.list.filter((item, index) => index % 8 === 0).map(item => ({
                dt: item.dt,
                temp: { day: item.main.temp },
                weather: item.weather,
                rain: item.rain ? item.rain['3h'] : 0
            }));
        }

        // Update current weather info
        document.getElementById("temp").textContent = Math.round(weatherData.main.temp) + "°C";
        document.getElementById("humidity").textContent = weatherData.main.humidity + "%";

        // Calculate rainfall
        let todayRainAmount = 0;
        if (forecastDays && forecastDays.length > 0 && (forecastDays[0].rain || forecastDays[0].pop > 0)) {
            todayRainAmount = (typeof forecastDays[0].rain === 'object' ? (forecastDays[0].rain['1h'] || forecastDays[0].rain['3h'] || 0) : (forecastDays[0].rain || 0));
            if (todayRainAmount === 0 && forecastDays[0].pop > 0) {
                todayRainAmount = forecastDays[0].pop * 10;
            }
        } else if (weatherData.rain && (weatherData.rain['1h'] || weatherData.rain['3h'])) {
            todayRainAmount = weatherData.rain['1h'] || weatherData.rain['3h'];
        }

        document.getElementById("rainfall").textContent = todayRainAmount.toFixed(1) + "mm";

        // Render forecast cards
        let daysToRender = forecastDays;
        if (forecastDays.length > 7) {
            daysToRender = forecastDays.slice(0, 7);
        }

        forecastContainer.innerHTML = '';
        daysToRender.forEach((day, i) => {
            const dateObj = new Date(day.dt * 1000);
            const dateStr = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            const wMain = day.weather[0].main;
            const iconHtml = weatherIcons[wMain] || '<i class="fa-solid fa-cloud" style="color: #94a3b8;"></i>';
            const tempVal = Math.round(day.temp.day);

            const dayDiv = document.createElement("div");
            dayDiv.className = "forecast-day";
            dayDiv.innerHTML = `
                <div class="f-date">${dateStr}</div>
                <div class="f-icon">${iconHtml}</div>
                <div class="f-temp">${tempVal}°C</div>
                <div class="f-desc">${day.weather[0].description}</div>
            `;
            forecastContainer.appendChild(dayDiv);
        });

        // Advanced Logic for Crop Guard and AquaSmart
        const currentTemp = weatherData.main.temp;
        const currentHumidity = weatherData.main.humidity;
        const isRaining = weatherData.weather[0].main === 'Rain' || weatherData.weather[0].main === 'Drizzle' || todayRainAmount > 2;

        generateAgriculturalIntel(crop, currentTemp, currentHumidity, isRaining, todayRainAmount);

        // Smooth scroll to results
        dashboardContent.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error(error);
        alert("Error fetching weather data. Please check your network or API key.");
    } finally {
        // Hide Loader
        loader.classList.remove("active");
    }
});

function generateAgriculturalIntel(crop, temp, humidity, isRaining, rainAmount) {
    const riskEl = document.getElementById("diseaseRisk");
    const alertEl = document.getElementById("cropAlert");
    const irrigationEl = document.getElementById("irrigation");
    const cropGuardIcon = document.querySelector('.intel-card:nth-child(1) .card-icon');
    const aquaSmartIcon = document.querySelector('.intel-card:nth-child(2) .card-icon');

    // Default Intelligence
    let diseaseRisk = "Low";
    let riskColor = "green";
    let cropAlertMsg = "Conditions are generally favorable. Continue standard monitoring.";
    let irrigationMsg = "Maintain standard irrigation schedule.";    

    switch (crop) {
        case "Rice":
            if (humidity > 80 && temp >= 25 && temp <= 30) {
                diseaseRisk = "High"; riskColor = "red";
                cropAlertMsg = "CRITICAL: Very high risk of Rice Blast (Magnaporthe oryzae). Consider preventive fungicidal spray.";
            } else if (humidity > 70) {
                diseaseRisk = "Medium"; riskColor = "yellow";
                cropAlertMsg = "Watch: Elevated humidity increases risk of Sheath Blight.";
            }
            if (isRaining || rainAmount > 5) {
                irrigationMsg = "PAUSE IRRIGATION: Recent/expected rainfall is sufficient.";
                aquaSmartIcon.className = "card-icon green";
            } else if (temp > 35) {
                irrigationMsg = "INCREASE IRRIGATION: High temperatures detected. Flood fields.";
                aquaSmartIcon.className = "card-icon yellow";
            }
            break;

        case "Wheat":
            if (humidity > 75 && temp >= 15 && temp <= 25) {
                diseaseRisk = "High"; riskColor = "red";
                cropAlertMsg = "ALERT: Favorable conditions for Wheat Rust. Inspect leaves immediately.";
            }
            if (isRaining || rainAmount > 2) {
                irrigationMsg = "PAUSE IRRIGATION: Sufficient rainfall; wheat is sensitive to waterlogging.";
                aquaSmartIcon.className = "card-icon green";
            }
            break;

        case "Maize":
            if (temp > 28 && humidity > 60) {
                diseaseRisk = "Medium"; riskColor = "yellow";
                cropAlertMsg = "Watch: Favorable for Northern Corn Leaf Blight.";
            }
            if (isRaining || rainAmount > 8) {
                irrigationMsg = "PAUSE IRRIGATION: Heavy rain expected. Ensure drainage.";
                aquaSmartIcon.className = "card-icon green";
            } else if (temp > 32) {
                irrigationMsg = "URGENT IRRIGATION: Maize is susceptible to drought at high temps.";
                aquaSmartIcon.className = "card-icon red";
            }
            break;

        case "Potato":
            if (temp >= 15 && temp <= 20 && humidity > 90) {
                diseaseRisk = "High"; riskColor = "red";
                cropAlertMsg = "CRITICAL ALERT: Late Blight risk is extremely high. Spray immediately.";
            }
            if (isRaining) {
                irrigationMsg = "PAUSE IRRIGATION: Prevent waterlogging to stop tuber rotting.";
                aquaSmartIcon.className = "card-icon green";
            }
            break;

        case "Tomato":
            if (temp >= 20 && temp <= 25 && humidity > 80) {
                diseaseRisk = "High"; riskColor = "red";
                cropAlertMsg = "High Risk of Early and Late Blight. Provide ventilation.";
            }
            if (isRaining) {
                irrigationMsg = "PAUSE IRRIGATION. Wet leaves cause fungal issues.";
                aquaSmartIcon.className = "card-icon green";
            }
            break;

        default:
            if (humidity > 85 && temp >= 20 && temp <= 28) {
                diseaseRisk = "Medium"; riskColor = "yellow";
                cropAlertMsg = "High humidity favors fungal diseases.";
            }
            if (isRaining || rainAmount > 5) {
                irrigationMsg = "PAUSE IRRIGATION: Rainfall is sufficient.";
                aquaSmartIcon.className = "card-icon green";
            }
            break;
    }

    // Apply Disease Risk UI
    riskEl.textContent = diseaseRisk;
    cropGuardIcon.className = `card-icon ${riskColor}`;

    if (diseaseRisk === "High") {
        riskEl.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
        riskEl.style.color = "var(--red)";
    } else if (diseaseRisk === "Medium") {
        riskEl.style.backgroundColor = "rgba(245, 158, 11, 0.2)";
        riskEl.style.color = "var(--yellow)";
    } else {
        riskEl.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
        riskEl.style.color = "var(--green)";
    }

    alertEl.textContent = cropAlertMsg;
    irrigationEl.textContent = irrigationMsg;
}
