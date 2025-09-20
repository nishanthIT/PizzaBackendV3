-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "comboStyleItemId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "comboStyleItemId" TEXT;

-- CreateTable
CREATE TABLE "ComboStyleItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "sizePricing" JSONB NOT NULL,
    "availableSauces" JSONB NOT NULL,
    "availableSides" JSONB NOT NULL,
    "availableDrinks" JSONB NOT NULL,
    "mealDealConfig" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboStyleItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_comboStyleItemId_fkey" FOREIGN KEY ("comboStyleItemId") REFERENCES "ComboStyleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_comboStyleItemId_fkey" FOREIGN KEY ("comboStyleItemId") REFERENCES "ComboStyleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboStyleItem" ADD CONSTRAINT "ComboStyleItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
