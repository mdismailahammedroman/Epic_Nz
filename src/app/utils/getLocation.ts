/* eslint-disable @typescript-eslint/no-explicit-any */
import { envVar } from "../config/envVar";
import axios from "axios";

export const getPlaceName = async (
  lat: number,
  long: number,
): Promise<string> => {
  // Ensure coordinates are valid
  if (isNaN(lat) || isNaN(long)) {
    throw new Error("Invalid coordinates provided");
  }

  const token = envVar.MAPBOX_ACCESS_TOKEN;

  // ✅ Map box expects: longitude,latitude
  const map_boxURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    long,
  )},${encodeURIComponent(lat)}.json?access_token=${encodeURIComponent(
    token,
  )}&types=address,place,locality,neighborhood,poi&limit=1`;

  try {
    const response = await axios.get(map_boxURL);

    // Check if the API response contains address data
    if (response.data && response.data.address) {
      const address = response.data.address;
      const road = address.road || "No road information available";
      const city =
        address.city ||
        address.town ||
        address.village ||
        "No city information available";
      const county = address.country || "No county information available";
      const country_code =
        address.country_code || "No country code information available";

      // Construct the address string
      return `Road: ${road}, City: ${city}, County: ${county}, Country Code: ${country_code}`;
    } else {
      // If no address data is found, return a default message
      return "Unknown Location";
    }
  } catch (error: any) {
    // Handle different error scenarios
    if (error.response && error.response.status === 401) {
      console.error(
        "Invalid API key or unauthorized access:",
        error.response.data,
      );
      throw new Error(
        "Invalid API key or unauthorized access. Check your key.",
      );
    } else if (error.response && error.response.status === 404) {
      console.error("No results found for the given coordinates.");
      return "No results found for the given coordinates.";
    } else {
      console.error("Error in geocoding:", error.message);
      throw new Error("Error in geocoding: " + error.message);
    }
  }
};
