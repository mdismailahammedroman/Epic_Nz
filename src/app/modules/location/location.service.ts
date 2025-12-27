import axios from "axios";

import { envVar } from "../../config/envVar";
import { JwtPayload } from "jsonwebtoken";
import Location from "./location.model";

// Fetch all locations, optionally filtered by category
const getLocations = async (category?: string) => {
  const filter = category ? { type: category } : {}; // Ensure we're filtering by the 'type' field in your Location schema
  console.log("Location Filter:", filter); // Log the filter being applied
  const locations = await Location.find(filter); // Fetch locations based on the filter
  console.log("Fetched Locations:", locations); // Log the fetched locations
  return locations;
};

// Get a location's details by its ID

const saveLocation = async (userId: string, locationId: string) => {
  // Convert string IDs to ObjectId using mongoose.Types.ObjectId
  // const userObjectId = mongoose.Types.ObjectId(userId); // Convert userId to ObjectId
  // const locationObjectId = mongoose.Types.ObjectId(locationId); // Convert locationId to ObjectId
  // // Find the user by userId (now correctly treated as ObjectId)
  // const user = await User.findById(userObjectId);
  // if (!user) throw new Error("User not found");
  // // Ensure savedLocations is initialized if undefined
  // user.savedLocations = user.savedLocations || [];
  // // Check if the location is already saved
  // if (!user.savedLocations.includes(locationObjectId)) {
  //   user.savedLocations.push(locationObjectId); // Add locationId (as ObjectId) to savedLocations
  //   await user.save(); // Save updated user data
  //   return { message: "Location saved successfully" };
  // }
  // return { message: "Location is already saved" };
};

// Submit a new location for admin approval
const submitNewLocation = async (
  userId: JwtPayload, // The userId from the JWT payload
  name: string,
  coordinates: { lat: number; lon: number },
  description: string,
  photos: string[]
) => {
  // Create a new location document
  const newLocation = new Location({
    userId: userId._id, // Save the userId as ObjectId
    name,
    coordinates,
    description,
    photos,
    status: "Pending", // Submitted for admin approval
  });
  console.log("New Location:", newLocation);
};

// Fetch weather data using OpenWeather API
const fetchWeather = async (lat: string, lon: string) => {
  const apiKey = envVar.OPENWEATHER_API_KEY; // Use your OpenWeather API key
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(weatherUrl); // Make API call to fetch weather data
    return response.data; // Return weather data
  } catch (error) {
    throw new Error("Error fetching weather data");
  }
};
export const locationServices = {
  getLocations,

  saveLocation,
  submitNewLocation,
  fetchWeather,
};
