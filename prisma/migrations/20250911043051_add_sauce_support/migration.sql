/*
  Warnings:

  - The values [SMALL] on the enum `PizzaSize` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PizzaSize_new" AS ENUM ('MEDIUM', 'LARGE', 'SUPER_SIZE');
ALTER TYPE "PizzaSize" RENAME TO "PizzaSize_old";
ALTER TYPE "PizzaSize_new" RENAME TO "PizzaSize";
DROP TYPE "PizzaSize_old";
COMMIT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "sauce" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "sauce" TEXT;

-- AlterTable
ALTER TABLE "OtherItem" ADD COLUMN     "availableSauces" TEXT;

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "pizzaId" TEXT,
    "otherItemId" TEXT,
    "quantity" INTEGER NOT NULL,
    "size" TEXT,
    "itemType" TEXT NOT NULL DEFAULT 'PIZZA',

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComboItem_comboId_pizzaId_otherItemId_size_key" ON "ComboItem"("comboId", "pizzaId", "otherItemId", "size");

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "ComboOffers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_pizzaId_fkey" FOREIGN KEY ("pizzaId") REFERENCES "Pizza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_otherItemId_fkey" FOREIGN KEY ("otherItemId") REFERENCES "OtherItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
