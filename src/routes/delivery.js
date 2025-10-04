import express from 'express';
import {
  calculateDeliveryCharge,
  validateDeliveryCharge,
  getDeliveryZones
} from '../controllers/deliveryController.js';

const router = express.Router();

// Calculate delivery charge by address/postcode
router.post('/calculate', calculateDeliveryCharge);

// Validate delivery charge (for checkout security)
router.post('/validate', validateDeliveryCharge);

// Get delivery zones information
router.get('/zones', getDeliveryZones);

export default router;