import { Router } from "express";
import { locationController } from "./location.controller"; // Correct import
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";

const locationRouter = Router();

// Routes for locations and location details
locationRouter.get("/", locationController.getAllLocations); // Get all locations
locationRouter.get("/nearby", locationController.getNearbyLocations); // Get nearby locations

// Routes for saving and submitting locations
locationRouter.post("/save", checkAuth(), locationController.saveLocation); // Save a location to the user's profile
locationRouter.post(
  "/submit",
  checkAuth(...Object.values(Role.USER)),
  locationController.submitNewLocation
); // Submit a new location

// Route for fetching weather data by location
locationRouter.get("/weather/:lat/:lon", locationController.getWeatherData); // Get weather data for location (lat, lon)

export { locationRouter };
