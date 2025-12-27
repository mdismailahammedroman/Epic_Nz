import axios from "axios";

export const getPlaceName = async (
  lat: number,
  long: number
): Promise<string> => {
  const googleGeoCodingAPI = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${long}&format=json`;

  try {
    const response = await axios.get(googleGeoCodingAPI);

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

      const placeInfo = `${road}, ${city}, ${county}, ${country_code}`;
      return placeInfo;
    } else {
      throw new Error("Unable to get the place name from Nominatim");
    }
  } catch (error: any) {
    console.error("Error in geocoding:", error);
    throw new Error("Error in geocoding: " + error.message);
  }
};
