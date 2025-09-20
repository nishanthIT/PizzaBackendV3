-- Enhancement of ComboStyleItem model for more flexibility
-- This migration adds support for:
-- 1. Custom size names and pricing
-- 2. Dynamic sauce entry
-- 3. Configurable sides/drinks selection limits
-- 4. Normal price vs deal price configuration

-- The existing ComboStyleItem table already supports:
-- - sizePricing: JSON field for flexible size configurations
-- - availableSauces: JSON array for custom sauce names
-- - availableSides: JSON array for available sides
-- - availableDrinks: JSON array for available drinks  
-- - mealDealConfig: JSON for configuring selection limits per size

-- No schema changes needed as the current JSON structure already supports
-- the requested flexibility. The frontend will be updated to utilize
-- this flexibility properly.

-- Example of the new flexible JSON structures:
-- sizePricing: {
--   "Small Portion": {"basePrice": 3.50, "mealDealPrice": 6.50},
--   "Regular": {"basePrice": 5.95, "mealDealPrice": 8.95},
--   "Large": {"basePrice": 9.50, "mealDealPrice": 13.95},
--   "Family Size": {"basePrice": 15.50, "mealDealPrice": 21.95}
-- }
-- 
-- availableSauces: ["Custom Peri Peri", "Mild Garlic", "Hot & Spicy", "BBQ Fusion"]
--
-- mealDealConfig: {
--   "Small Portion": {"sideCount": 1, "drinkCount": 1},
--   "Regular": {"sideCount": 1, "drinkCount": 1}, 
--   "Large": {"sideCount": 2, "drinkCount": 2},
--   "Family Size": {"sideCount": 3, "drinkCount": 3}
-- }

SELECT 'ComboStyleItem schema already supports required flexibility' as status;