-- Add support for other items in combos
-- This migration will extend the ComboPizza model to support all item types

-- First, let's create a new table for combo items that can handle both pizzas and other items
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "pizzaId" TEXT,
    "otherItemId" TEXT,
    "quantity" INTEGER NOT NULL,
    "size" TEXT,
    "itemType" TEXT NOT NULL DEFAULT 'PIZZA', -- 'PIZZA' or 'OTHER_ITEM'

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "ComboOffers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_pizzaId_fkey" FOREIGN KEY ("pizzaId") REFERENCES "Pizza"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_otherItemId_fkey" FOREIGN KEY ("otherItemId") REFERENCES "OtherItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add check constraint to ensure either pizzaId or otherItemId is set, but not both
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_item_check" CHECK (
    (("pizzaId" IS NOT NULL AND "otherItemId" IS NULL) OR ("pizzaId" IS NULL AND "otherItemId" IS NOT NULL))
);

-- Create unique index
CREATE UNIQUE INDEX "ComboItem_comboId_pizzaId_otherItemId_size_key" ON "ComboItem"("comboId", "pizzaId", "otherItemId", "size");
