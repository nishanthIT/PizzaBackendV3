import axios from 'axios';
import { getDistance } from 'geolib';

// Restaurant location (example coordinates for Croydon - update with actual restaurant location)
const RESTAURANT_LOCATION = {
  latitude: 51.3728,
  longitude: -0.1014,
  postcode: 'CR0 7AE' // Restaurant's postcode
};

// Maximum delivery distance in meters (3km = 3000m)
const MAX_DELIVERY_DISTANCE = 3000;

/**
 * Get coordinates for a UK postcode using postcodes.io API
 * @param {string} postcode - UK postcode
 * @returns {Object} - { latitude, longitude, isValid }
 */
export const getPostcodeCoordinates = async (postcode) => {
  try {
    // Clean the postcode
    const cleanPostcode = postcode.trim().toUpperCase().replace(/\s+/g, '');
    
    // Validate UK postcode format (basic regex)
    const ukPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/;
    if (!ukPostcodeRegex.test(cleanPostcode)) {
      return { isValid: false, error: 'Invalid UK postcode format' };
    }

    // Call postcodes.io API (free UK postcode service)
    const response = await axios.get(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`);
    
    if (response.data.status === 200 && response.data.result) {
      const { latitude, longitude, postcode: validPostcode } = response.data.result;
      return {
        isValid: true,
        latitude,
        longitude,
        postcode: validPostcode,
        formattedPostcode: validPostcode
      };
    }
    
    return { isValid: false, error: 'Postcode not found' };
  } catch (error) {
    console.error('Error fetching postcode coordinates:', error.message);
    return { isValid: false, error: 'Service temporarily unavailable' };
  }
};

/**
 * Search for UK postcodes that match the search term
 * @param {string} searchTerm - Partial postcode to search for
 * @returns {Array} - Array of matching postcodes
 */
export const searchPostcodes = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    // Clean search term
    const cleanTerm = searchTerm.trim().toUpperCase();
    
    // Use postcodes.io autocomplete API
    const response = await axios.get(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanTerm)}/autocomplete`);
    
    if (response.data.status === 200 && response.data.result) {
      // Return first 10 suggestions
      return response.data.result.slice(0, 10);
    }
    
    return [];
  } catch (error) {
    console.error('Error searching postcodes:', error.message);
    return [];
  }
};

/**
 * Calculate distance between restaurant and delivery address
 * @param {string} deliveryPostcode - Customer's postcode
 * @returns {Object} - { distance, isWithinRange, coordinates }
 */
export const calculateDeliveryDistance = async (deliveryPostcode) => {
  try {
    // Get coordinates for the delivery postcode
    const postcodeData = await getPostcodeCoordinates(deliveryPostcode);
    
    if (!postcodeData.isValid) {
      return {
        isValid: false,
        error: postcodeData.error
      };
    }

    // Calculate distance using geolib
    const distance = getDistance(
      {
        latitude: RESTAURANT_LOCATION.latitude,
        longitude: RESTAURANT_LOCATION.longitude
      },
      {
        latitude: postcodeData.latitude,
        longitude: postcodeData.longitude
      }
    );

    // Convert distance to km for display
    const distanceKm = distance / 1000;
    const isWithinRange = distance <= MAX_DELIVERY_DISTANCE;

    return {
      isValid: true,
      distance: distance, // in meters
      distanceKm: parseFloat(distanceKm.toFixed(2)), // in km
      isWithinRange,
      maxDistanceKm: MAX_DELIVERY_DISTANCE / 1000,
      customerCoordinates: {
        latitude: postcodeData.latitude,
        longitude: postcodeData.longitude
      },
      restaurantCoordinates: RESTAURANT_LOCATION,
      postcode: postcodeData.formattedPostcode
    };
  } catch (error) {
    console.error('Error calculating delivery distance:', error.message);
    return {
      isValid: false,
      error: 'Unable to calculate delivery distance'
    };
  }
};

/**
 * Validate if a postcode is within delivery range
 * @param {string} postcode - Customer's postcode
 * @returns {Object} - Validation result
 */
export const validateDeliveryPostcode = async (postcode) => {
  try {
    const result = await calculateDeliveryDistance(postcode);
    
    if (!result.isValid) {
      return result;
    }

    if (!result.isWithinRange) {
      return {
        isValid: false,
        error: `Sorry, we don't deliver to ${postcode}. This location is ${result.distanceKm}km away, but we only deliver within ${result.maxDistanceKm}km of our restaurant.`,
        distance: result.distanceKm,
        maxDistance: result.maxDistanceKm
      };
    }

    return {
      isValid: true,
      message: `Great! We deliver to ${result.postcode}. Distance: ${result.distanceKm}km`,
      distance: result.distanceKm,
      postcode: result.postcode
    };
  } catch (error) {
    console.error('Error validating delivery postcode:', error.message);
    return {
      isValid: false,
      error: 'Unable to validate delivery area'
    };
  }
};
