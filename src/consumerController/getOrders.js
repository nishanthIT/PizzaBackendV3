import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getOrders = async (req, res) => {
  console.log("hited the order")
  try {
    const userId = req.user.userId; // Make sure this matches your JWT token structure

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            pizza: true,
            combo: true,
            otherItem: true, // Include otherItem to get the name and details
            userChoice: true, // Include userChoice to get meal deal names
            comboStyleItem: true, // Include comboStyleItem for combo style items
            periPeri: true, // Include periPeri for peri peri items
            orderToppings: true,
            orderIngredients: true,
          },
        },
      },    
    });

    // Log userChoice data for debugging
    console.log("=== ORDER ITEMS DEBUG ===");
    orders.forEach((order, orderIndex) => {
      console.log(`Order ${orderIndex + 1} (${order.id}):`);
      order.orderItems.forEach((item, itemIndex) => {
        if (item.userChoiceId) {
          console.log(`  Item ${itemIndex + 1}:`);
          console.log(`    userChoiceId: ${item.userChoiceId}`);
          console.log(`    userChoice object:`, item.userChoice);
          console.log(`    userChoiceSelections:`, item.userChoiceSelections);
        }
      });
    });
    console.log("=== END DEBUG ===");

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching your orders",
      error: error.message,
    });
  }
};
