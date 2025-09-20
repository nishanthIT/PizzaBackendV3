// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// export const getCart = async (req, res) => {
//     const { userId } = req.query;

//     const cart = await prisma.cart.findFirst({
//       where: { userId },
//       include: {
//         cartItems: {
//           include: {
//             pizza: true,
//             cartToppings: true,
//             cartIngredients: true
//           }
//         }
//       }
//     });

//     res.status(200).json(cart);

// }
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getCart = async (req, res) => {
  const { userId } = req.query;

  try {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        cartItems: {
          include: {
            pizza: true,
            combo: true,
            comboStyleItem: true, // Add combo style item relation
            otherItem: true,
            cartToppings: {
              include: {
                topping: {
                  select: { name: true },
                },
              },
            },
            cartIngredients: {
              include: {
                ingredient: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (cart) {
      // Process cart items to resolve side/drink IDs for combo-style items
      const processedCartItems = await Promise.all(
        cart.cartItems.map(async (item) => {
          let processedItem = {
            ...item,
            cartToppings: item.cartToppings.map((t) => ({
              ...t,
              name: t.topping.name,
            })),
            cartIngredients: item.cartIngredients.map((i) => ({
              ...i,
              name: i.ingredient.name,
            })),
          };

          // Process combo-style items to resolve IDs to full objects
          if (item.comboStyleItemId) {
            let selectedSideObjects = [];
            let selectedDrinkObjects = [];

            // Resolve side IDs to full objects
            if (item.selectedSides) {
              try {
                const sideIds = JSON.parse(item.selectedSides);
                if (Array.isArray(sideIds) && sideIds.length > 0) {
                  selectedSideObjects = await prisma.otherItem.findMany({
                    where: {
                      id: { in: sideIds },
                    },
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      imageUrl: true,
                    },
                  });
                }
              } catch (e) {
                console.error('Error parsing selectedSides:', e);
              }
            }

            // Resolve drink IDs to full objects
            if (item.selectedDrinks) {
              try {
                const drinkIds = JSON.parse(item.selectedDrinks);
                if (Array.isArray(drinkIds) && drinkIds.length > 0) {
                  selectedDrinkObjects = await prisma.otherItem.findMany({
                    where: {
                      id: { in: drinkIds },
                    },
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      imageUrl: true,
                    },
                  });
                }
              } catch (e) {
                console.error('Error parsing selectedDrinks:', e);
              }
            }

            // Add resolved objects to the item
            processedItem.selectedSideObjects = selectedSideObjects;
            processedItem.selectedDrinkObjects = selectedDrinkObjects;
          }

          return processedItem;
        })
      );

      const flattenedCart = {
        ...cart,
        cartItems: processedCartItems,
      };

      res.status(200).json(flattenedCart);
    } else {
      res.status(404).json({ error: "Cart not found" });
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const getCart = async (req, res) => {
//   const { userId } = req.query;

//   try {
//     const cart = await prisma.cart.findFirst({
//       where: { userId },
//       include: {
//         cartItems: {
//           include: {
//             pizza: true,
//             cartToppings: {
//               include: {
//                 topping: {
//                   select: { name: true },
//                 },
//               },
//             },
//             cartIngredients: {
//               include: {
//                 ingredient: {
//                   select: { name: true },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     if (cart) {
//       res.status(200).json(cart);
//     } else {
//       res.status(404).json({ error: "Cart not found" });
//     }
//   } catch (error) {
//     console.error("Error fetching cart:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const getCart = async (req, res) => {
//     const { userId } = req.query;

//     try {
//         const cart = await prisma.cart.findFirst({
//             where: { userId },
//             include: {
//                 cartItems: {
//                     include: {
//                         pizza: true,
//                         cartToppings: true,
//                         cartIngredients: true
//                     }
//                 }
//             }
//         });

//         if (cart) {
//             res.status(200).json(cart);
//         } else {
//             res.status(404).json({ error: "Cart not found" });
//         }
//     } catch (error) {
//         console.error("Error fetching cart:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };
