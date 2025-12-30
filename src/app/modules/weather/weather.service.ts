import axios from "axios";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelper/AppError";
import { envVar } from "../../config/envVar";

const weatherInfo = async (latitude: number, longitude: number) => {
  try {
    const responseData = await axios.get(envVar.WEATHER_API_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: envVar.OPENWEATHER_API_KEY,
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
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch weather data"
    );
  }
};

export const weatherServices = {
  weatherInfo,
};
