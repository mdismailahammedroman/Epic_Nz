import { JwtPayload } from "jsonwebtoken";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { locationServices } from "./location.service";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Location from "./location.model";

// Get all locations (can be filtered by category)
const getAllLocations = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.query;
    console.log("Category Filter:", category);
    const locations = await locationServices.getLocations(
      typeof category === "string" ? category : undefined
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Locations fetched successfully",
      data: locations,
    });
  }
);

// Get a single location's details by ID
const RADIUS = 10000; // 10 kilometers

// Get nearby locations based on user location and category
const getNearbyLocations = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, category } = req.query;

    if (!latitude || !longitude || !category) {
      return res
        .status(400)
        .json({ message: "Latitude, longitude, and category are required" });
    }

    // Parse latitude and longitude to numbers
    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);

    // Find nearby locations within the specified radius and category
    const locations = await Location.find({
      category: category, // Filter by category
      coordinates: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat], // Use [longitude, latitude]
          },
          $maxDistance: RADIUS, // Maximum distance in meters
        },
      },
    });

    if (locations.length === 0) {
      return res.status(404).json({ message: "No nearby locations found" });
    }

    res.status(200).json({ locations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Save a location to the user's profile
const saveLocation = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, locationId } = req.body;
    const result = await locationServices.saveLocation(userId, locationId);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Location saved successfully",
      data: result,
    });
  }
);

// Submit a new location (for admin approval)
const submitNewLocation = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user as string; // Access the userId from the decoded JWT token

    if (!userId) {
      res.status(400).json({
        status: "fail",
        message: "User not found in token",
      });
      return;
    }

    // Cast userId to ObjectId using mongoose.Types.ObjectId()
    const userObjectId = new mongoose.Types.ObjectId(userId); // Ensure userId is an ObjectId

    const { name, coordinates, description, photos } = req.body;

    // Validate the input fields
    if (!name || !coordinates || !description || !photos) {
      res.status(400).json({
        status: "fail",
        message:
          "All fields (name, coordinates, description, photos) are required.",
      });
      return;
    }

    // Call the service to submit the location
    const newLocation = await locationServices.submitNewLocation(
      userObjectId, // Pass the ObjectId
      name,
      coordinates,
      description,
      photos
    );

    res.status(201).json({
      status: "success",
      message: "Location submitted for admin approval.",
      data: newLocation,
    });
  }
);

// Get weather data for a specific location (latitude, longitude)
const getWeatherData = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { lat, lon } = req.params; // Extract lat and lon from URL parameters
    const weatherData = await locationServices.fetchWeather(lat, lon);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Weather data fetched successfully",
      data: weatherData,
    });
  }
);

export const locationController = {
  getAllLocations,
  getNearbyLocations,
  saveLocation,
  submitNewLocation,
  getWeatherData,
};
