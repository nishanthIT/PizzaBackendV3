-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "isMealDeal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPeriPeri" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "periPeriId" TEXT,
ADD COLUMN     "selectedDrinks" TEXT,
ADD COLUMN     "selectedSides" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "isMealDeal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPeriPeri" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "periPeriId" TEXT,
ADD COLUMN     "selectedDrinks" TEXT,
ADD COLUMN     "selectedSides" TEXT;

-- CreateTable
CREATE TABLE "PeriPeriItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "mealDealPrice" DECIMAL(65,30),
    "sideCount" INTEGER NOT NULL DEFAULT 0,
    "drinkCount" INTEGER NOT NULL DEFAULT 0,
    "itemType" TEXT NOT NULL,
    "availableSauces" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriPeriItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_periPeriId_fkey" FOREIGN KEY ("periPeriId") REFERENCES "PeriPeriItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_periPeriId_fkey" FOREIGN KEY ("periPeriId") REFERENCES "PeriPeriItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
