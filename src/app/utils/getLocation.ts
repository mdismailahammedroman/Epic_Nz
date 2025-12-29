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
      return `Road: ${road}, City: ${city}, County: ${county}, Country Code: ${country_code}`;
    } else {
      throw new Error("Unable to get the place name from Nominatim");
    }
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      console.error("Blocked by Nominatim API:", error.response.data);
      throw new Error(
        "Access to Nominatim API has been blocked. Consider using a different API or review the usage policy."
      );
    } else {
      console.error("Error in geocoding:", error);
      throw new Error("Error in geocoding: " + error.message);
    }
  }
};
