import express from 'express';
import {
  searchPostcodes,
  validateDeliveryPostcode,
  calculateDeliveryDistance,
  getPostcodeCoordinates
} from '../services/postalCodeService.js';

const router = express.Router();

/**
 * GET /api/postcodes/search?q=searchTerm
 * Search for UK postcodes matching the search term
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const postcodes = await searchPostcodes(q);
    res.json(postcodes);
  } catch (error) {
    console.error('Postcode search error:', error);
    res.status(500).json({ error: 'Failed to search postcodes' });
  }
});

/**
 * POST /api/postcodes/validate
 * Validate if a postcode is within delivery range
 * Body: { postcode: "SW1A 1AA" }
 */
router.post('/validate', async (req, res) => {
  try {
    const { postcode } = req.body;
    
    if (!postcode) {
      return res.status(400).json({
        isValid: false,
        error: 'Postcode is required'
      });
    }

    const result = await validateDeliveryPostcode(postcode);
    
    if (result.isValid) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Postcode validation error:', error);
    res.status(500).json({
      isValid: false,
      error: 'Failed to validate postcode'
    });
  }
});

/**
 * POST /api/postcodes/distance
 * Calculate distance between restaurant and delivery postcode
 * Body: { postcode: "SW1A 1AA" }
 */
router.post('/distance', async (req, res) => {
  try {
    const { postcode } = req.body;
    
    if (!postcode) {
      return res.status(400).json({
        isValid: false,
        error: 'Postcode is required'
      });
    }

    const result = await calculateDeliveryDistance(postcode);
    res.json(result);
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({
      isValid: false,
      error: 'Failed to calculate distance'
    });
  }
});

/**
 * GET /api/postcodes/coordinates/:postcode
 * Get coordinates for a specific postcode
 */
router.get('/coordinates/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    
    const result = await getPostcodeCoordinates(postcode);
    
    if (result.isValid) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Coordinates lookup error:', error);
    res.status(500).json({
      isValid: false,
      error: 'Failed to get coordinates'
    });
  }
});

export default router;
