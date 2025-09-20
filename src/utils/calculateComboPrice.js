import { Prisma, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Calculate combo price based on items and discount
 * @param {Array} items - Array of combo items (pizzas and other items)
 * @param {Number} discount - Discount percentage (0-100)
 * @returns {Prisma.Decimal} - Final calculated price
 */
export const calculateComboPrice = async (items, discount = 0) => {
  let totalPrice = new Prisma.Decimal(0);

  for (const item of items) {
    let itemPrice = new Prisma.Decimal(0);

    if (item.itemType === 'PIZZA' && item.pizzaId) {
      // Handle pizza items
      const pizza = await prisma.pizza.findUnique({
        where: { id: item.pizzaId },
      });

      if (!pizza) {
        throw new Error(`Pizza with id ${item.pizzaId} does not exist`);
      }

      // Parse the sizes JSON string
      const sizes = JSON.parse(pizza.sizes);
      const sizeKey = item.size ? item.size.toUpperCase() : 'MEDIUM';
      const sizePrice = sizes[sizeKey];

      if (sizePrice === undefined) {
        throw new Error(
          `Size ${item.size} not available for pizza ${pizza.name}`
        );
      }

      itemPrice = new Prisma.Decimal(sizePrice);
    } else if (item.itemType === 'OTHER_ITEM' && item.otherItemId) {
      // Handle other items
      const otherItem = await prisma.otherItem.findUnique({
        where: { id: item.otherItemId },
      });

      if (!otherItem) {
        throw new Error(`Other item with id ${item.otherItemId} does not exist`);
      }

      itemPrice = new Prisma.Decimal(otherItem.price);
    } else if (item.pizzaId) {
      // Backward compatibility for old pizza-only format
      const pizza = await prisma.pizza.findUnique({
        where: { id: item.pizzaId },
      });

      if (!pizza) {
        throw new Error(`Pizza with id ${item.pizzaId} does not exist`);
      }

      const sizes = JSON.parse(pizza.sizes);
      const sizeKey = item.size ? item.size.toUpperCase() : 'MEDIUM';
      const sizePrice = sizes[sizeKey];

      if (sizePrice === undefined) {
        throw new Error(
          `Size ${item.size} not available for pizza ${pizza.name}`
        );
      }

      itemPrice = new Prisma.Decimal(sizePrice);
    } else {
      throw new Error("Invalid item: must have either pizzaId or otherItemId");
    }

    // Add to total price using Decimal for precision
    totalPrice = totalPrice.add(itemPrice.times(item.quantity || 1));
  }

  // Calculate discount
  const discountAmount = totalPrice.times(discount).dividedBy(100);
  const finalPrice = totalPrice.minus(discountAmount);
console.log(`🔧 Calculated combo price: ${finalPrice} (Total: ${totalPrice}, Discount: ${discount}%)`);
  return finalPrice;
};
