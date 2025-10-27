-- Migration to convert sizePricing JSON to individual price columns
-- This script will preserve existing pricing data

-- Step 1: Add new price columns (they're already in schema)
-- Step 2: Migrate data from sizePricing JSON to individual columns
-- Step 3: Drop sizePricing column

-- Migrate data for each Pizza Builder Deal
UPDATE "pizza_builder_deals" 
SET 
  "smallPrice" = CASE 
    WHEN "sizePricing"::text LIKE '%"small"%' OR "sizePricing"::text LIKE '%"Small"%' THEN 
      CAST(("sizePricing"->>'small') AS DECIMAL)
    WHEN "sizePricing"::text LIKE '%"Small"%' THEN 
      CAST(("sizePricing"->>'Small') AS DECIMAL)
    ELSE NULL
  END,
  "mediumPrice" = CASE 
    WHEN "sizePricing"::text LIKE '%"medium"%' OR "sizePricing"::text LIKE '%"Medium"%' THEN 
      CAST(("sizePricing"->>'medium') AS DECIMAL)
    WHEN "sizePricing"::text LIKE '%"Medium"%' THEN 
      CAST(("sizePricing"->>'Medium') AS DECIMAL)
    ELSE NULL
  END,
  "largePrice" = CASE 
    WHEN "sizePricing"::text LIKE '%"large"%' OR "sizePricing"::text LIKE '%"Large"%' THEN 
      CAST(("sizePricing"->>'large') AS DECIMAL)
    WHEN "sizePricing"::text LIKE '%"Large"%' THEN 
      CAST(("sizePricing"->>'Large') AS DECIMAL)
    ELSE NULL
  END
WHERE "sizePricing" IS NOT NULL;

-- Set default medium price if no prices were migrated (fallback)
UPDATE "pizza_builder_deals" 
SET "mediumPrice" = 12.99 
WHERE "smallPrice" IS NULL AND "mediumPrice" IS NULL AND "largePrice" IS NULL;