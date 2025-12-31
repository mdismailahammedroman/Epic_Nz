import axios from "axios";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelper/AppError";
import { envVar } from "../../config/envVar";
import Location from "../location/location.model";

// Fetch weather data from OpenWeather API
const weatherInfo = async (latitude: number, longitude: number) => {
  try {
    // Ensure latitude and longitude are numbers
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid latitude or longitude"
      );
    }

    const responseData = await axios.get(envVar.WEATHER_API_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: envVar.OPENWEATHER_API_KEY, // API Key from the environment
        units: "metric", // Temperature in Celsius
      },
    });

    const weatherData = responseData.data;

    return {
      location: weatherData.name,
      country: weatherData.sys.country,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      icon: weatherData.weather[0].icon,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);

    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch weather data"
    );
  }
};

const weatherInfoByLocationId = async (locationId: string) => {
  // Fetch the location from the database using the locationId
  const location = await Location.findById(locationId);

  if (!location) {
    throw new AppError(StatusCodes.NOT_FOUND, "Location not found");
  }

  // Extract the coordinates (longitude, latitude)
  const [longitude, latitude] = location.coordinates.coordinates;

  // Construct the request URL for the weather API
  const url = `${envVar.WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${envVar.OPENWEATHER_API_KEY}&units=metric`;

  try {
    // Make the request to the weather API
    const response = await axios.get(url);
    const weatherData = response.data; // Extract the data from the response

    // Return structured weather data
    return {
      location: weatherData.name,
      Road: weatherData.Road,
      country: weatherData.sys.country,
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      icon: weatherData.weather[0].icon,
    };
  } catch (error: any) {
    console.error(
      "Error fetching weather data:",
      error.response ? error.response.data : error.message
    );
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch weather data"
    );
  }
};
// Get sunrise and sunset times for a specific location
// router.get sunrise-sunset/:locationId WeatherController.getSunriseSunset
// Fetch sunrise and sunset times from Sunrise-Sunset API based on locationId
const weatherSunriseAndSunset = async (locationId: string) => {
  // Fetch the location from the database using the locationId
  const location = await Location.findById(locationId);

  if (!location) {
    throw new AppError(StatusCodes.NOT_FOUND, "Location not found");
  }

  // Extract the coordinates (longitude, latitude)
  const [longitude, latitude] = location.coordinates.coordinates;

  // Construct the request URL for the weather API
  const url = `${envVar.WEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${envVar.OPENWEATHER_API_KEY}&units=metric`;

  try {
    // Make the request to the weather API
    const response = await axios.get(url);
    const weatherData = response.data; // Extract the data from the response

    return {
      sunrise: weatherData.sys.sunrise,
      sunset: weatherData.sys.sunset,
    };
  } catch (error: any) {
    console.error("Error fetching sunrise and sunset data:", error);

    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch sunrise and sunset times"
    );
  }
};

export const weatherServices = {
  weatherInfo,
  weatherInfoByLocationId,
  weatherSunriseAndSunset,
};
