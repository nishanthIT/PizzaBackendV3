// // Create a new file: consumerController/getOrders.js

// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// export const getOrders = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const orders = await prisma.order.findMany({
//       where: { userId },
//       orderBy: { createdAt: "desc" },
//       include: {
//         orderItems: {
//           include: {
//             pizza: true,
//             orderToppings: true,
//             orderIngredients: true,
//             otherItem: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: orders,
//     });
//   } catch (error) {
//     console.error("Error fetching orders:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching your orders",
//       error: error.message,
//     });
//   }
// };

// // Add this route to your router (in consumer.js)
// // router.get("/orders", authenticateUser, getOrders);


import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        orderItems: {
          include: {
            pizza: true,
            combo: true,
            comboStyleItem: true, // Add combo style item relation
            orderToppings: true,
            orderIngredients: true,
            otherItem: true,
            periPeri: true, // Include periPeri relation too
          },
        },
      },
    });

    // Process orders to add selectedSidesNames and selectedDrinksNames
    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const processedOrderItems = await Promise.all(
          order.orderItems.map(async (orderItem) => {
            let selectedSidesNames = [];
            let selectedDrinksNames = [];

            // Process meal deal items (combo style items and peri peri items)
            if (orderItem.isMealDeal && (orderItem.comboStyleItemId || orderItem.periPeriId)) {
              try {
                // Get selected sides names
                if (orderItem.selectedSides) {
                  const selectedSidesIds = JSON.parse(orderItem.selectedSides);
                  if (Array.isArray(selectedSidesIds) && selectedSidesIds.length > 0) {
                    const sidesData = await prisma.otherItem.findMany({
                      where: {
                        id: {
                          in: selectedSidesIds
                        }
                      },
                      select: {
                        id: true,
                        name: true
                      }
                    });
                    
                    // Maintain the order of selection
                    selectedSidesNames = selectedSidesIds.map(sideId => {
                      const sideItem = sidesData.find(item => item.id === sideId);
                      return sideItem ? sideItem.name : 'Unknown Side';
                    });
                  }
                }

                // Get selected drinks names
                if (orderItem.selectedDrinks) {
                  const selectedDrinksIds = JSON.parse(orderItem.selectedDrinks);
                  if (Array.isArray(selectedDrinksIds) && selectedDrinksIds.length > 0) {
                    const drinksData = await prisma.otherItem.findMany({
                      where: {
                        id: {
                          in: selectedDrinksIds
                        }
                      },
                      select: {
                        id: true,
                        name: true
                      }
                    });
                    
                    // Maintain the order of selection
                    selectedDrinksNames = selectedDrinksIds.map(drinkId => {
                      const drinkItem = drinksData.find(item => item.id === drinkId);
                      return drinkItem ? drinkItem.name : 'Unknown Drink';
                    });
                  }
                }
              } catch (parseError) {
                console.error('Error parsing selected sides/drinks JSON:', parseError);
                // Continue with empty arrays if JSON parsing fails
              }
            }

            return {
              ...orderItem,
              selectedSidesNames,
              selectedDrinksNames
            };
          })
        );

        return {
          ...order,
          orderItems: processedOrderItems
        };
      })
    );

    console.log('🔧 Processed orders with combo style items:', {
      totalOrders: processedOrders.length,
      ordersWithComboStyleItems: processedOrders.filter(order => 
        order.orderItems.some(item => item.comboStyleItemId)
      ).length
    });

    return res.status(200).json({
      success: true,
      data: processedOrders,
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