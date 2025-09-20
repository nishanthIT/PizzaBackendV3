/*
  Warnings:

  - The `selectedDrinks` column on the `CartItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `selectedSides` column on the `CartItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `availableDrinks` on the `ComboStyleItem` table. All the data in the column will be lost.
  - You are about to drop the column `availableSides` on the `ComboStyleItem` table. All the data in the column will be lost.
  - The `selectedDrinks` column on the `OrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `selectedSides` column on the `OrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ComboStyleItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "mealDealItems" JSONB,
ADD COLUMN     "selectedSauces" JSONB,
DROP COLUMN "selectedDrinks",
ADD COLUMN     "selectedDrinks" JSONB,
DROP COLUMN "selectedSides",
ADD COLUMN     "selectedSides" JSONB;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ComboStyleItem" DROP COLUMN "availableDrinks",
DROP COLUMN "availableSides",
ADD COLUMN     "drinksCategoryId" TEXT,
ADD COLUMN     "sidesCategoryId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "mealDealItems" JSONB,
ADD COLUMN     "selectedSauces" JSONB,
DROP COLUMN "selectedDrinks",
ADD COLUMN     "selectedDrinks" JSONB,
DROP COLUMN "selectedSides",
ADD COLUMN     "selectedSides" JSONB;

-- AddForeignKey
ALTER TABLE "ComboStyleItem" ADD CONSTRAINT "ComboStyleItem_sidesCategoryId_fkey" FOREIGN KEY ("sidesCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboStyleItem" ADD CONSTRAINT "ComboStyleItem_drinksCategoryId_fkey" FOREIGN KEY ("drinksCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
