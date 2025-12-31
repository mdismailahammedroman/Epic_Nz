import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { weatherServices } from "./weather.service";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelper/AppError";
import Location from "../location/location.model";
const weatherInfo = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latitude, longitude } = req.query as Record<string, string>;
    if (!latitude || !longitude) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Latitude and longitude are required"
      );
    }
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid latitude or longitude"
      );
    }

    const result = await weatherServices.weatherInfo(lat, lon);

    sendResponse(res, {
      success: true,
      message: "Weather data fetched successfully",
      statusCode: StatusCodes.OK,
      data: result,
    });
  }
);

const weatherInfoByLocationId = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: locationId } = req.params; // Accessing 'id' from URL

    if (!locationId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Location ID is required");
    }

    const weatherData = await weatherServices.weatherInfoByLocationId(
      locationId
    );
    sendResponse(res, {
      success: true,
      message: "Weather data fetched successfully",
      statusCode: StatusCodes.OK,
      data: weatherData,
    });
  }
);
const weatherSunriseAndSunset = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: locationId } = req.params; // Accessing 'id' from URL

    if (!locationId) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Location ID is required");
    }
    const weatherData = await weatherServices.weatherSunriseAndSunset(
      locationId
    );
    console.log(weatherData);

    sendResponse(res, {
      success: true,
      message: "Weather data fetched successfully",
      statusCode: StatusCodes.OK,
      data: weatherData,
    });
  }
);

export const weatherController = {
  weatherInfo,
  weatherInfoByLocationId,
  weatherSunriseAndSunset,
};
