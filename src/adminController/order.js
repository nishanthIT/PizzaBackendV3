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
              userChoice: true, // Add user choice relation
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

    // Debug: Log the raw order data
    console.log('🔍 Raw order data:', {
      orderId: order.id,
      orderItemsCount: order.orderItems.length,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        userChoiceId: item.userChoiceId,
        userChoiceSelections: item.userChoiceSelections,
        pizzaId: item.pizzaId,
        comboId: item.comboId,
        otherItemId: item.otherItemId,
        comboStyleItemId: item.comboStyleItemId,
        userChoice: item.userChoice ? { id: item.userChoice.id, name: item.userChoice.name } : null
      }))
    });

    // Collect all unique item IDs from all order items
    const allItemIds = new Set();
    const allPizzaIds = new Set();
    const allUserChoiceIds = new Set();
    
    order.orderItems.forEach(orderItem => {
      // Handle combo style meal deals
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

      // **NEW: Handle user choice items**
      if (orderItem.userChoiceId && orderItem.userChoiceSelections) {
        allUserChoiceIds.add(orderItem.userChoiceId);
        try {
          const selections = JSON.parse(orderItem.userChoiceSelections);
          Object.values(selections).forEach(categoryItems => {
            if (Array.isArray(categoryItems)) {
              categoryItems.forEach(item => {
                if (item.id) {
                  // Determine if it's a pizza or other item based on item structure
                  if (item.sizes) {
                    allPizzaIds.add(item.id);
                  } else {
                    allItemIds.add(item.id);
                  }
                }
              });
            }
          });
        } catch (parseError) {
          console.error('Error parsing user choice selections for order item:', orderItem.id, parseError);
        }
      }
    });

    // Fetch all items in separate queries
    let itemsMap = new Map();
    let pizzasMap = new Map();
    let userChoicesMap = new Map();
    
    // Fetch other items (sides, drinks, etc.)
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

    // **NEW: Fetch pizzas**
    if (allPizzaIds.size > 0) {
      const pizzas = await prisma.pizza.findMany({
        where: {
          id: {
            in: Array.from(allPizzaIds)
          }
        },
        select: {
          id: true,
          name: true,
          description: true
        }
      });
      
      pizzas.forEach(pizza => {
        pizzasMap.set(pizza.id, pizza);
      });
    }

    // **NEW: Fetch user choices**
    if (allUserChoiceIds.size > 0) {
      const userChoices = await prisma.userChoice.findMany({
        where: {
          id: {
            in: Array.from(allUserChoiceIds)
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          categoryConfigs: true
        }
      });
      
      userChoices.forEach(userChoice => {
        userChoicesMap.set(userChoice.id, userChoice);
      });
    }

    // Process order items to add selectedSidesNames and selectedDrinksNames
    const processedOrderItems = order.orderItems.map(orderItem => {
      let selectedSidesNames = [];
      let selectedDrinksNames = [];
      let userChoiceDetails = null;

      // Handle combo style meal deals
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

      // **NEW: Handle user choice items**
      if (orderItem.userChoiceId && orderItem.userChoiceSelections) {
        try {
          const userChoice = userChoicesMap.get(orderItem.userChoiceId);
          const selections = JSON.parse(orderItem.userChoiceSelections);
          
          if (userChoice) {
            const categoryConfigs = typeof userChoice.categoryConfigs === 'string' 
              ? JSON.parse(userChoice.categoryConfigs) 
              : userChoice.categoryConfigs || [];

            const selectedItemsByCategory = {};
            
            Object.keys(selections).forEach(categoryId => {
              const categoryItems = selections[categoryId] || [];
              const categoryConfig = categoryConfigs.find(config => config.categoryId === categoryId);
              
              if (categoryConfig) {
                selectedItemsByCategory[categoryConfig.type || categoryConfig.categoryName || 'Unknown'] = 
                  categoryItems.map(item => {
                    let itemName = 'Unknown Item';
                    if (item.sizes) {
                      // Pizza item
                      const pizza = pizzasMap.get(item.id);
                      itemName = pizza ? pizza.name : item.name || 'Unknown Pizza';
                    } else {
                      // Other item
                      itemName = itemsMap.get(item.id) || item.name || 'Unknown Item';
                    }
                    
                    return {
                      name: itemName,
                      quantity: item.quantity || 1
                    };
                  });
              }
            });

            userChoiceDetails = {
              name: userChoice.name,
              description: userChoice.description,
              selectedItems: selectedItemsByCategory
            };
          }
        } catch (parseError) {
          console.error('Error parsing user choice selections for order item:', orderItem.id, parseError);
        }
      } 
      // **FALLBACK: Handle orphaned user choice items (items with no identifiers)**
      else if (!orderItem.pizzaId && !orderItem.comboId && !orderItem.otherItemId && 
               !orderItem.comboStyleItemId && !orderItem.userChoiceId &&
               orderItem.price && parseFloat(orderItem.price) > 50) {
        // This looks like an orphaned user choice item
        console.log('🔧 Found orphaned user choice item:', orderItem.id, 'price:', orderItem.price);
        userChoiceDetails = {
          name: 'User Choice Deal',
          description: 'Custom meal deal selection',
          selectedItems: {
            'Unknown': [{
              name: 'Selected items not available (legacy order)',
              quantity: 1
            }]
          }
        };
      }

      return {
        ...orderItem,
        selectedSidesNames,
        selectedDrinksNames,
        userChoiceDetails // Add user choice details
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
              userChoice: true, // Add user choice relation
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
