import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { weatherServices } from "./weather.service";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelper/AppError";

// Controller function to handle the weather request
const weatherInfo = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract latitude and longitude from query parameters
    const { latitude, longitude } = req.query; // Using req.query instead of req.params

    // Check if latitude and longitude are provided
    if (!latitude || !longitude) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Latitude and longitude are required"
      );
    }

    // Ensure latitude and longitude are numbers
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid latitude or longitude"
      );
    }

    // Fetch the weather data using the weather service
    const result = await weatherServices.weatherInfo(lat, lon);
    console.log("result weather:", result);

    // Send the weather data in the response
    sendResponse(res, {
      success: true,
      message: "Weather data fetched successfully",
      statusCode: StatusCodes.OK,
      data: result,
    });
  }
);

export const weatherController = {
  weatherInfo,
};
