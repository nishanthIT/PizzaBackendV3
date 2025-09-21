import prisma from "../lib/prisma.js";
import { withRetry } from "../lib/dbRetry.js";

// const getOrderDetails = async (req, res) => {
//   try {
//     const orderId = req.params.id;

//     const order = await withRetry(async () => {
//       return await prisma.order.findUnique({
//         where: { id: orderId },
//         include: {
//           user: {
//             select: {
//               name: true,
//               email: true,
//               phone: true,
//               address: true,
//             },
//           },
//           orderItems: {
//             include: {
//               pizza: true,
//               combo: true,
//               comboStyleItem: true, // Add combo style item relation
//               orderToppings: true,
//               otherItem: true, 
//               orderIngredients: true,
//             },
//           },
//         },
//       });
//     });

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     return res.status(200).json(order);
//   } catch (error) {
//     console.error("Error fetching order details:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await withRetry(async () => {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          orderItems: {
            include: {
              pizza: true,
              combo: true,
              comboStyleItem: true,
              orderToppings: true,
              otherItem: true, 
              orderIngredients: true,
            },
          },
        },
      });
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Collect all unique item IDs from all order items
    const allItemIds = new Set();
    
    order.orderItems.forEach(orderItem => {
      if (orderItem.isMealDeal) {
        try {
          if (orderItem.selectedSides) {
            const sideIds = JSON.parse(orderItem.selectedSides);
            if (Array.isArray(sideIds)) {
              sideIds.forEach(id => allItemIds.add(id));
            }
          }
          if (orderItem.selectedDrinks) {
            const drinkIds = JSON.parse(orderItem.selectedDrinks);
            if (Array.isArray(drinkIds)) {
              drinkIds.forEach(id => allItemIds.add(id));
            }
          }
        } catch (parseError) {
          console.error('Error parsing JSON for order item:', orderItem.id, parseError);
        }
      }
    });

    // Fetch all items in a single query
    let itemsMap = new Map();
    if (allItemIds.size > 0) {
      const items = await prisma.otherItem.findMany({
        where: {
          id: {
            in: Array.from(allItemIds)
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      items.forEach(item => {
        itemsMap.set(item.id, item.name);
      });
    }

    // Process order items to add selectedSidesNames and selectedDrinksNames
    const processedOrderItems = order.orderItems.map(orderItem => {
      let selectedSidesNames = [];
      let selectedDrinksNames = [];

      if (orderItem.isMealDeal) {
        try {
          // Get selected sides names
          if (orderItem.selectedSides) {
            const selectedSidesIds = JSON.parse(orderItem.selectedSides);
            if (Array.isArray(selectedSidesIds)) {
              selectedSidesNames = selectedSidesIds.map(sideId => 
                itemsMap.get(sideId) || 'Unknown Side'
              );
            }
          }

          // Get selected drinks names
          if (orderItem.selectedDrinks) {
            const selectedDrinksIds = JSON.parse(orderItem.selectedDrinks);
            if (Array.isArray(selectedDrinksIds)) {
              selectedDrinksNames = selectedDrinksIds.map(drinkId => 
                itemsMap.get(drinkId) || 'Unknown Drink'
              );
            }
          }
        } catch (parseError) {
          console.error('Error parsing selected sides/drinks JSON for order item:', orderItem.id, parseError);
        }
      }

      return {
        ...orderItem,
        selectedSidesNames,
        selectedDrinksNames
      };
    });

    // Return the order with processed items
    const processedOrder = {
      ...order,
      orderItems: processedOrderItems
    };

    console.log('🔧 Processed order with sides/drinks names:', {
      orderId: processedOrder.id,
      itemsProcessed: processedOrderItems.length,
      totalSidesNames: processedOrderItems.reduce((acc, item) => acc + item.selectedSidesNames.length, 0),
      totalDrinksNames: processedOrderItems.reduce((acc, item) => acc + item.selectedDrinksNames.length, 0)
    });

    return res.status(200).json(processedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};









const getAllOrders = async (req, res) => {
  try {
    const orders = await withRetry(async () => {
      return await prisma.order.findMany({
        include: {
          orderItems: {
            include: {
              pizza: true,
              combo: true,
              comboStyleItem: true, // Add combo style item relation
              otherItem: true, // Add other item relation
              orderToppings: true,
              orderIngredients: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
        },
      });
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Orders not found" });
    }

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const changeOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.body.status;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = ["PENDING", "CONFIRMED", "DELIVERED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return res
      .status(200)
      .json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { getOrderDetails, getAllOrders, changeOrderStatus };
