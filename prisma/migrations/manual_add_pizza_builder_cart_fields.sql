-- Manual migration to add Pizza Builder cart fields
-- Run this when database connection is restored

ALTER TABLE "CartItem" 
ADD COLUMN IF NOT EXISTS "additionalToppingCost" DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxToppings" INTEGER DEFAULT 4;

-- Add comments for documentation
COMMENT ON COLUMN "CartItem"."additionalToppingCost" IS 'Extra cost for toppings beyond the included limit in Pizza Builder';
COMMENT ON COLUMN "CartItem"."maxToppings" IS 'Maximum number of included toppings for Pizza Builder items';