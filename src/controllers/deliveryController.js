import { Client } from '@googlemaps/google-maps-services-js';
import { PrismaClient } from '@prisma/client';

const client = new Client({});
const prisma = new PrismaClient();

// Restaurant location
const RESTAURANT_ADDRESS = "274 Lower Addiscombe Road, Croydon CR0 7AE, UK";
const RESTAURANT_COORDS = {
  lat: 51.3818739,
  lng: -0.0692967
};

// Calculate delivery charge based on distance
const calculateDeliveryCharge = (distanceInMiles) => {
  console.log(`Calculating delivery charge for distance: ${distanceInMiles} miles`);
  
  // Define delivery charges and zones
  const DELIVERY_CHARGES = {
    ZONE_1: { maxMiles: 2, charge: 2.95 },
    ZONE_2: { maxMiles: 3, charge: 3.95 },
    ZONE_3: { maxMiles: 4, charge: 4.95 },
    MAX_DELIVERY_DISTANCE: 4
  };
  
  if (distanceInMiles > DELIVERY_CHARGES.MAX_DELIVERY_DISTANCE) {
    return {
      canDeliver: false,
      charge: 0,
      message: `Sorry, we don't deliver beyond ${DELIVERY_CHARGES.MAX_DELIVERY_DISTANCE} miles from our restaurant.`
    };
  }
  
  let charge;
  let zone;
  
  if (distanceInMiles <= DELIVERY_CHARGES.ZONE_1.maxMiles) {
    charge = DELIVERY_CHARGES.ZONE_1.charge;
    zone = "Zone 1 (0-2 miles)";
  } else if (distanceInMiles <= DELIVERY_CHARGES.ZONE_2.maxMiles) {
    charge = DELIVERY_CHARGES.ZONE_2.charge;
    zone = "Zone 2 (2-3 miles)";
  } else if (distanceInMiles <= DELIVERY_CHARGES.ZONE_3.maxMiles) {
    charge = DELIVERY_CHARGES.ZONE_3.charge;
    zone = "Zone 3 (3-4 miles)";
  }
  
  return {
    canDeliver: true,
    charge: parseFloat(charge.toFixed(2)),
    zone: zone,
    distance: parseFloat(distanceInMiles.toFixed(2)),
    message: `Delivery charge: £${charge.toFixed(2)} for ${zone}`
  };
};

// Convert meters to miles
const metersToMiles = (meters) => {
  return meters * 0.000621371;
};

// Get delivery charge by address
const getDeliveryChargeByAddress = async (req, res) => {
  try {
    const { address, postcode } = req.body;
    
    console.log(`🚀 Starting delivery calculation for: ${postcode || address}`);
    
    if (!address && !postcode) {
      return res.status(400).json({
        success: false,
        message: "Please provide an address or postcode"
      });
    }
    
    const destinationAddress = postcode ? postcode : address;
    
    console.log(`Calculating delivery for: ${destinationAddress}`);
    
    // Check if Google Maps API key is configured
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log(`🔑 API Key check: "${apiKey}" (length: ${apiKey ? apiKey.length : 'undefined'})`);
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.log('⚠️  Google Maps API key not configured, using mock data');
      
      // Provide mock response based on postcode for testing
      let mockDistance = 2.5; // Default distance in miles
      
      // Simple mock based on postcode patterns for testing
      if (destinationAddress.includes('CR0')) {
        mockDistance = 1.5; // Close to restaurant
      } else if (destinationAddress.includes('SW') || destinationAddress.includes('SE')) {
        mockDistance = 3.2; // Medium distance
      } else {
        mockDistance = 2.8; // Default distance
      }
      
      const deliveryInfo = calculateDeliveryCharge(mockDistance);
      
      if (!deliveryInfo.canDeliver) {
        return res.status(200).json({
          success: false,
          message: deliveryInfo.message,
          data: {
            canDeliver: false,
            charge: 0,
            distance: mockDistance,
            zone: null
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `Delivery available (Mock data - distance: ${mockDistance.toFixed(1)} miles)`,
        data: {
          canDeliver: true,
          charge: deliveryInfo.charge,
          distance: mockDistance,
          zone: deliveryInfo.zone,
          mockData: true
        }
      });
    }
    
    // Use Google Maps Distance Matrix API
    const response = await client.distancematrix({
      params: {
        origins: [RESTAURANT_ADDRESS],
        destinations: [destinationAddress],
        units: 'imperial', // This will give us miles
        mode: 'driving',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    console.log('Google Maps API Response:', JSON.stringify(response.data, null, 2));
    
    const element = response.data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: "Unable to find the address. Please check and try again.",
        error: element.status
      });
    }
    
    // Extract distance - Google Maps API always returns distance.value in meters
    // even when units=imperial (only distance.text shows miles)
    const distanceValue = element.distance.value; // Always in meters
    const distanceText = element.distance.text;   // Human readable (e.g., "2.4 mi")
    
    console.log(`🔍 Google Maps API Response:`, {
      distanceValue: distanceValue,
      distanceText: distanceText,
      type: typeof distanceValue
    });
    
    // Always convert from meters to miles (distance.value is always meters)
    const distanceInMiles = metersToMiles(distanceValue);
    console.log(`✅ Distance conversion: ${distanceValue} meters = ${distanceInMiles.toFixed(2)} miles (text: ${distanceText})`);
    
    const deliveryInfo = calculateDeliveryCharge(distanceInMiles);
    
    res.json({
      success: true,
      data: {
        ...deliveryInfo,
        destinationAddress: destinationAddress,
        distanceText: element.distance.text,
        durationText: element.duration.text
      }
    });
    
  } catch (error) {
    console.error('Delivery calculation error:', error);
    res.status(500).json({
      success: false,
      message: "Error calculating delivery charge",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get delivery charge by coordinates (backup method)
const getDeliveryChargeByCoords = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Please provide latitude and longitude"
      });
    }
    
    console.log(`Calculating delivery for coordinates: ${lat}, ${lng}`);
    
    // Use Google Maps Distance Matrix API with coordinates
    const response = await client.distancematrix({
      params: {
        origins: [`${RESTAURANT_COORDS.lat},${RESTAURANT_COORDS.lng}`],
        destinations: [`${lat},${lng}`],
        units: 'imperial', // This will give us miles
        mode: 'driving',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    const element = response.data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate distance to the provided location",
        error: element.status
      });
    }
    
    // Extract distance - Google Maps API always returns distance.value in meters
    // even when units=imperial (only distance.text shows miles)
    const distanceValue = element.distance.value; // Always in meters
    const distanceText = element.distance.text;   // Human readable (e.g., "2.4 mi")
    
    // Always convert from meters to miles (distance.value is always meters)
    const distanceInMiles = metersToMiles(distanceValue);
    console.log(`✅ Coordinates distance: ${distanceValue} meters = ${distanceInMiles.toFixed(2)} miles (text: ${distanceText})`);
    
    const deliveryInfo = calculateDeliveryCharge(distanceInMiles);
    
    res.json({
      success: true,
      data: {
        ...deliveryInfo,
        coordinates: { lat, lng },
        distanceText: element.distance.text,
        durationText: element.duration.text
      }
    });
    
  } catch (error) {
    console.error('Delivery calculation error:', error);
    res.status(500).json({
      success: false,
      message: "Error calculating delivery charge",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Validate delivery charge (for checkout security)
const validateDeliveryCharge = async (req, res) => {
  try {
    const { address, postcode, expectedCharge } = req.body;
    
    if (!address && !postcode) {
      return res.status(400).json({
        success: false,
        message: "Address or postcode required for validation"
      });
    }
    
    if (expectedCharge === undefined || expectedCharge === null) {
      return res.status(400).json({
        success: false,
        message: "Expected delivery charge required for validation"
      });
    }
    
    const destinationAddress = postcode ? postcode : address;
    
    // Recalculate delivery charge on server
    const response = await client.distancematrix({
      params: {
        origins: [RESTAURANT_ADDRESS],
        destinations: [destinationAddress],
        units: 'imperial',
        mode: 'driving',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    const element = response.data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      return res.status(400).json({
        success: false,
        message: "Unable to validate delivery address"
      });
    }
    
    // Extract distance - Google Maps API always returns distance.value in meters
    // even when units=imperial (only distance.text shows miles)
    const distanceValue = element.distance.value; // Always in meters
    const distanceText = element.distance.text;   // Human readable (e.g., "2.4 mi")
    
    // Always convert from meters to miles (distance.value is always meters)
    const distanceInMiles = metersToMiles(distanceValue);
    console.log(`✅ Validation distance: ${distanceValue} meters = ${distanceInMiles.toFixed(2)} miles (text: ${distanceText})`);
    
    const deliveryInfo = calculateDeliveryCharge(distanceInMiles);
    
    // Check if expected charge matches calculated charge
    const isValid = Math.abs(deliveryInfo.charge - expectedCharge) < 0.01; // Allow 1 penny difference for rounding
    
    res.json({
      success: true,
      data: {
        isValid: isValid,
        calculatedCharge: deliveryInfo.charge,
        expectedCharge: expectedCharge,
        canDeliver: deliveryInfo.canDeliver,
        distance: deliveryInfo.distance,
        zone: deliveryInfo.zone
      }
    });
    
  } catch (error) {
    console.error('Delivery validation error:', error);
    res.status(500).json({
      success: false,
      message: "Error validating delivery charge",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get delivery zones info
const getDeliveryZones = (req, res) => {
  // Define delivery charges and zones
  const DELIVERY_CHARGES = {
    ZONE_1: { maxMiles: 2, charge: 2.95 },
    ZONE_2: { maxMiles: 3, charge: 3.95 },
    ZONE_3: { maxMiles: 4, charge: 4.95 },
    MAX_DELIVERY_DISTANCE: 4
  };

  res.json({
    success: true,
    data: {
      restaurantAddress: RESTAURANT_ADDRESS,
      maxDeliveryDistance: DELIVERY_CHARGES.MAX_DELIVERY_DISTANCE,
      zones: [
        {
          zone: "Zone 1",
          range: "0-2 miles",
          charge: DELIVERY_CHARGES.ZONE_1.charge
        },
        {
          zone: "Zone 2", 
          range: "2-3 miles",
          charge: DELIVERY_CHARGES.ZONE_2.charge
        },
        {
          zone: "Zone 3",
          range: "3-4 miles", 
          charge: DELIVERY_CHARGES.ZONE_3.charge
        }
      ]
    }
  });
};

export {
  getDeliveryChargeByAddress as calculateDeliveryCharge,
  validateDeliveryCharge,
  getDeliveryZones
};