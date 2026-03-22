const API_KEY = "0a2ed6c622a5119f1184e765753bd46c";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const cityName = document.getElementById("cityName");
const searchButton = document.getElementById("searchButton");
const myLocationButton = document.getElementById("myLocationButton");
const cityDisplay = document.getElementById("cityDisplay");
const countryName = document.getElementById("countryName");
const weatherIcon = document.getElementById("weatherIcon");
const temperatureid = document.getElementById("temperatureid");
const toggleUnit = document.getElementById("toggleUnit");
const weatherCondition = document.getElementById("weatherCondition");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const forecastCards = document.getElementById("forecastCards");
const pastSearches = document.getElementById("pastSearches");
const aiMessage = document.getElementById("aiMessage");
const errorMsg = document.getElementById("errorMsg");

let currentUnit = "metric";
let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

//fetches the weather data using API, and store it into "data"
let currentCity = "";
async function fetchWeather(city) {
  const response = await fetch(
    `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`,
  );
  const data = await response.json();

  if (data.cod === "404") {
    errorMsg.style.display = "block";
    return;
  }
  currentCity = data.name;
  errorMsg.style.display = "none";
  displayWeather(data);
  fetchForecast(city);
  updateHistory(data.name);
}

// updates all the elements with real data in the main Weather section
function displayWeather(data) {
  cityDisplay.textContent = data.name;
  countryName.textContent = data.sys.country;
  temperatureid.textContent =
    Math.round(data.main.temp) + (currentUnit === "metric" ? "°C" : "°F");
  weatherCondition.textContent = data.weather[0].description;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  humidity.querySelector("span").textContent = data.main.humidity + "%";
  windSpeed.querySelector("span").textContent =
    data.wind.speed + (currentUnit === "metric" ? " m/s" : " mph");
  updateBackground(data.weather[0].main);
  generateNote(data);
  animateCard(document.querySelector(".weather-card"));
}

function handleSearch() {
  let cName = cityName.value.trim();
  if (cName !== "") {
    fetchWeather(cName);
  }
}

searchButton.addEventListener("click", handleSearch);

cityName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

toggleUnit.addEventListener("click", () => {
  if (currentUnit === "metric") {
    currentUnit = "imperial";
    fetchWeather(currentCity);
  } else {
    currentUnit = "metric";
    fetchWeather(currentCity);
  }
});

//search history section
function updateHistory(city) {
  if (searchHistory.includes(city)) return;

  searchHistory.unshift(city);
  searchHistory = searchHistory.slice(0, 5);

  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));

  renderHistory();
}

function renderHistory() {
  pastSearches.innerHTML = "";

  if (searchHistory.length === 0) return;

  searchHistory.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    li.addEventListener("click", () => {
      fetchWeather(city);
      window.scrollTo({ top: 70, behavior: "smooth" });
    });
    pastSearches.appendChild(li);
  });
}

//forecast section

async function fetchForecast(city) {
  const response = await fetch(
    `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`,
  );
  const data = await response.json();

  const dailyForecasts = data.list
    .filter((entry) => entry.dt_txt.includes("12:00:00"))
    .slice(0, 5);

  forecastCards.innerHTML = "";

  dailyForecasts.forEach((entry) => {
    const day = new Date(entry.dt_txt).toLocaleDateString("en", {
      weekday: "short",
    });

    const icon = `https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png`;

    const temp =
      Math.round(entry.main.temp) + (currentUnit === "metric" ? "°C" : "°F");

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <p class="forecast-day">${day}</p>
      <img src="${icon}" alt="weather icon"/>
      <p class="forecast-temp">${temp}</p>
    `;

    forecastCards.appendChild(card);
  });
  animateCard(document.querySelector(".forecast-section"));
}

//mylocation button section

async function fetchWeatherByCoords(lat, lon) {
  const response = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`,
  );
  const data = await response.json();

  if (data.cod === "404") {
    errorMsg.style.display = "block";
    return;
  }

  errorMsg.style.display = "none";
  currentCity = data.name;
  displayWeather(data);
  updateHistory(data.name);
  fetchForecast(data.name); 
  window.scrollTo({ top: 0, behavior: "smooth" });
}

myLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser!");
    return;
  }

  myLocationButton.textContent = "Detecting...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      fetchWeatherByCoords(lat, lon);
      myLocationButton.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Use my location`;
    },

    (error) => {
      myLocationButton.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Use my location`;
      if (error.code === error.PERMISSION_DENIED) {
        alert(
          "Location access denied. Please allow location access and try again.",
        );
      } else {
        alert("Unable to detect location. Please try again.");
      }
    },
  );
});


//dynamic background
function updateBackground(weatherMain) {
  document.body.className = "";

  switch (weatherMain) {
    case "Clear":
      document.body.classList.add("weather-clear");
      break;
    case "Clouds":
      document.body.classList.add("weather-clouds");
      break;
    case "Rain":
    case "Drizzle":
      document.body.classList.add("weather-rain");
      break;
    case "Thunderstorm":
      document.body.classList.add("weather-thunderstorm");
      break;
    case "Snow":
      document.body.classList.add("weather-snow");
      break;
    case "Mist":
    case "Fog":
    case "Haze":
      document.body.classList.add("weather-mist");
      break;
    default:
      document.body.className = "";
  }
}


//todays note section
function generateNote(weatherData) {
  const condition = weatherData.weather[0].main;
  const temp = Math.round(weatherData.main.temp);
  const city = weatherData.name;

  const notes = {
    Clear: `Beautiful clear skies in ${city} today at ${temp}°C! Perfect day to head outside — don't forget your sunscreen if you're spending time outdoors. ☀️`,
    Clouds: `It's cloudy in ${city} today at ${temp}°C. A good day to carry a light jacket just in case — clouds can bring a surprise drizzle! ⛅`,
    Rain: `It's raining in ${city} today at ${temp}°C. Definitely grab an umbrella before heading out and wear waterproof shoes if you can! 🌧️`,
    Thunderstorm: `Thunderstorms in ${city} today at ${temp}°C — stay indoors if possible and avoid open areas. Stay safe out there! ⛈️`,
    Snow: `Snowing in ${city} today at ${temp}°C! Bundle up warm and be careful on slippery roads and footpaths. ❄️`,
    Mist: `Misty conditions in ${city} today at ${temp}°C. Drive carefully with headlights on and allow extra travel time. 🌫️`,
    Drizzle: `Light drizzle in ${city} today at ${temp}°C. A small umbrella or raincoat should be enough to keep you comfortable! 🌦️`,
  };

  aiMessage.textContent = notes[condition] || `Current weather in ${city} is ${condition} at ${temp}°C. Stay prepared and have a great day! 🌈`;
}

//automatically sets a default location when page loads
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      },
      (error) => {
        fetchWeather("London");
      }
    );
  } else {
    fetchWeather("London");
  }
});


//fade in section
function animateCard(element) {
  element.classList.remove("fade-in");
  void element.offsetWidth; 
  element.classList.add("fade-in");
}


renderHistory();
