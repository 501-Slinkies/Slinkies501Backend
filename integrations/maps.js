// integrations/maps.js
const axios = require("axios");

// Verify if an address is valid using OpenStreetMap Nominatim API Returns formatted address + lat/lon if found 

async function verifyAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await axios.get(url, { headers: { 'User-Agent': 'SlinkiesApp/1.0' } });

    if (response.data.length > 0) {
      const result = response.data[0];
      return {
        valid: true,
        formattedAddress: result.display_name,
        location: { lat: result.lat, lng: result.lon }
      };
    }

    return { valid: false };
  } catch (error) {
    console.error("Error verifying address:", error.message);
    return { valid: false, error: error.message };
  }
}

// Get route details using OSRM API Input: start = "lat,lng", end = "lat,lng"
async function getRoute(start, end) {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=false&geometries=polyline&steps=false`;
    const response = await axios.get(url);

    if (response.data.code === "Ok" && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: (route.distance / 1000).toFixed(2) + " km", // convert meters → km
        duration: Math.round(route.duration / 60) + " mins", // convert seconds → mins
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching route:", error.message);
    return { error: error.message };
  }
}

module.exports = { verifyAddress, getRoute };