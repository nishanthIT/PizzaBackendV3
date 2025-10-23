// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// export const addToCart = async (req, res) => {
//   try {
//     const userId = req.user?.id; // You need to have auth middleware set this
//     if (!userId) {
//       return res.status(200).json({ guest: true });
//     }

//     const {
//       pizzaId,
//       size,
//       quantity,
//       eachprice,
//       price,
//       toppings,
//       ingredients,
//     } = req.body;

//     // Get or create cart
//     let cart = await prisma.cart.findFirst({ where: { userId } });
//     if (!cart) {
//       cart = await prisma.cart.create({
//         data: { userId, totalAmount: price },
//       });
//     }

//     // Create CartItem
//     const cartItem = await prisma.cartItem.create({
//       data: {
//         cartId: cart.id,
//         pizzaId,
//         size,
//         quantity,
//         basePrice: eachprice,
//         finalPrice: price,
//         cartToppings: {
//           create: toppings.map((t) => ({
//             toppingId: t.id,
//             defaultQuantity: t.defaultQuantity || 0,
//             addedQuantity: t.addedQuantity || 1,
//           })),
//         },
//         cartIngredients: {
//           create: ingredients.map((i) => ({
//             ingredientId: i.id,
//             defaultQuantity: i.defaultQuantity || 0,
//             addedQuantity: i.addedQuantity || 1,
//           })),
//         },
//       },
//     });

//     // Return updated cart in flattened form
//     const fullCart = await prisma.cart.findFirst({
//       where: { userId },
//       include: {
//         cartItems: {
//           include: {
//             pizza: true,
//             cartToppings: { include: { topping: { select: { name: true } } } },
//             cartIngredients: { include: { ingredient: { select: { name: true } } } },
//           },
//         },
//       },
//     });

//     const flattenedCart = {
//       ...fullCart,
//       cartItems: fullCart.cartItems.map((item) => ({
//         ...item,
//         cartToppings: item.cartToppings.map((t) => ({ ...t, name: t.topping.name })),
//         cartIngredients: item.cartIngredients.map((i) => ({ ...i, name: i.ingredient.name })),
//       })),
//     };

//     res.status(200).json(flattenedCart);
//   } catch (err) {
//     console.error("Add to cart failed:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();

function itemsMatch(a, b) {
  // For Pizza Builder items, also check pizzaBuilderDealId and pizzaBase
  const basicMatch = a.pizzaId === b.pizzaId &&
    a.size === b.size &&
    JSON.stringify(a.toppings) === JSON.stringify(b.toppings) &&
    JSON.stringify(a.ingredients) === JSON.stringify(b.ingredients);

  // If both have Pizza Builder data, ensure they match
  if (a.pizzaBuilderDealId || b.pizzaBuilderDealId) {
    return basicMatch && 
           a.pizzaBuilderDealId === b.pizzaBuilderDealId &&
           a.pizzaBase === b.pizzaBase;
  }

  return basicMatch;
}

export default async function addToCart(req, res) {
  try {
    // Manually authenticate
    await new Promise((resolve, reject) => {
      authenticateUser(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const userId = req.user.id;
    const localItem = req.body; // assuming a single item is sent

    if (!localItem) {
      return res
        .status(400)
        .json({ error: "Missing cart item in request body" });
    }

    const pizzaId = localItem.pizzaId || localItem.pizza?.id || localItem.id;
    if (!pizzaId) {
      return res.status(400).json({ error: "Missing pizzaId in cart item" });
    }

    const toppings = localItem.toppings || [];
    const ingredients = localItem.ingredients || [];
    const size = localItem.size;
    const quantity = Number(localItem.quantity) || 1;
    let finalPrice = Number(localItem.price) || Number(localItem.finalPrice) || 0;
    let basePrice = Number(localItem.eachprice) || Number(localItem.basePrice) || 0;

    // Check if this is a Pizza Builder item by checking the pizza data structure
    const isPizzaBuilder = localItem.isPizzaBuilder || 
                          localItem.pizza?.isPizzaBuilder || 
                          (localItem.pizzaBuilderDealId !== undefined);

    console.log("🍕 AddToCart - Pizza Builder Detection:", {
      isPizzaBuilder,
      pizzaBuilderDealId: localItem.pizzaBuilderDealId,
      originalPrice: finalPrice,
      toppingsCount: toppings.reduce((sum, t) => sum + (t.quantity || 0), 0)
    });

    // If this is a Pizza Builder item, recalculate the price correctly
    if (isPizzaBuilder && localItem.pizzaBuilderDealId) {
      try {
        // Fetch the Pizza Builder Deal to get pricing rules
        const pizzaBuilderDeal = await prisma.pizzaBuilderDeal.findUnique({
          where: { id: localItem.pizzaBuilderDealId }
        });

        if (pizzaBuilderDeal) {
          console.log("🍕 Found Pizza Builder Deal:", {
            name: pizzaBuilderDeal.name,
            maxToppings: pizzaBuilderDeal.maxToppings,
            sizePricing: pizzaBuilderDeal.sizePricing
          });

          // Get base price from the deal's size pricing
          const sizePricing = typeof pizzaBuilderDeal.sizePricing === 'string' 
            ? JSON.parse(pizzaBuilderDeal.sizePricing) 
            : pizzaBuilderDeal.sizePricing;

          let dealBasePrice = 0;
          switch (size) {
            case "Large":
              dealBasePrice = Number(sizePricing?.LARGE || 7);
              break;
            case "Super Size":
              dealBasePrice = Number(sizePricing?.SUPER_SIZE || 8.7);
              break;
            default:
              dealBasePrice = Number(sizePricing?.MEDIUM || 6);
              break;
          }

          // Calculate topping pricing
          const maxFreeToppings = pizzaBuilderDeal.maxToppings || 4;
          const totalToppingUnits = toppings.reduce((sum, t) => sum + (t.quantity || 0), 0);
          const extraToppingUnits = Math.max(0, totalToppingUnits - maxFreeToppings);

          let toppingCost = 0;
          if (extraToppingUnits > 0) {
            // Size multiplier for toppings
            const sizeMultiplier = size === "Large" ? 1.5 : (size === "Super Size" ? 2 : 1);
            
            let extraUnitsRemaining = extraToppingUnits;
            toppings.forEach((topping) => {
              if (topping.quantity > 0 && extraUnitsRemaining > 0) {
                const unitsToCharge = Math.min(topping.quantity, extraUnitsRemaining);
                const toppingPrice = Number(topping.price) || 1;
                toppingCost += unitsToCharge * toppingPrice * sizeMultiplier;
                extraUnitsRemaining -= unitsToCharge;
              }
            });
          }

          // Add stuffed crust cost if applicable
          let stuffedCrustCost = 0;
          if (localItem.pizzaBase && localItem.pizzaBase.includes("Stuffed Crust")) {
            switch (size) {
              case "Large":
                stuffedCrustCost = 3;
                break;
              case "Super Size":
                stuffedCrustCost = 4;
                break;
              default:
                stuffedCrustCost = 2;
                break;
            }
          }

          // Calculate correct final price
          const correctedPrice = dealBasePrice + toppingCost + stuffedCrustCost;
          
          console.log("🍕 Pizza Builder Price Calculation:", {
            dealBasePrice,
            totalToppingUnits,
            maxFreeToppings,
            extraToppingUnits,
            toppingCost,
            stuffedCrustCost,
            originalPrice: finalPrice,
            correctedPrice,
            quantity
          });

          // Update prices with corrected values
          basePrice = correctedPrice;
          finalPrice = correctedPrice * quantity;
        }
      } catch (error) {
        console.error("🍕 Error recalculating Pizza Builder price:", error);
        // Continue with original price if there's an error
      }
    }

    // Find or create cart
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        cartItems: {
          include: {
            cartToppings: true,
            cartIngredients: true,
            pizza: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check for matching item
    const existing = cart.cartItems.find((item) =>
      itemsMatch(
        {
          pizzaId: item.pizzaId,
          size: item.size,
          toppings: item.cartToppings.map((t) => ({
            id: t.toppingId,
            quantity: t.addedQuantity,
          })),
          ingredients: item.cartIngredients.map((i) => ({
            id: i.ingredientId,
            quantity: i.addedQuantity,
          })),
          pizzaBuilderDealId: item.pizzaBuilderDealId,
          pizzaBase: item.pizzaBase,
        },
        {
          pizzaId,
          size,
          toppings,
          ingredients,
          pizzaBuilderDealId: localItem.pizzaBuilderDealId,
          pizzaBase: localItem.pizzaBase,
        }
      )
    );

    if (existing) {
      // Update quantity and price if item exists
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: quantity },
          finalPrice: existing.finalPrice + finalPrice,
        },
      });
    } else {
      // Create new item
      const cartItemData = {
        cartId: cart.id,
        pizzaId,
        size,
        quantity,
        basePrice,
        finalPrice,
        cartToppings: {
          create: toppings.map((t) => ({
            toppingId: t.id,
            defaultQuantity: 0,
            addedQuantity: t.quantity,
          })),
        },
        cartIngredients: {
          create: ingredients.map((i) => ({
            ingredientId: i.id,
            defaultQuantity: 0,
            addedQuantity: i.quantity,
          })),
        },
      };

      // Add Pizza Builder specific fields if applicable
      if (isPizzaBuilder && localItem.pizzaBuilderDealId) {
        cartItemData.pizzaBuilderDealId = localItem.pizzaBuilderDealId;
        cartItemData.maxToppings = localItem.maxToppings || null;
        
        // Store pizza base information
        if (localItem.pizzaBase) {
          cartItemData.pizzaBase = localItem.pizzaBase;
        }

        console.log("🍕 Creating Pizza Builder cart item:", {
          pizzaBuilderDealId: cartItemData.pizzaBuilderDealId,
          maxToppings: cartItemData.maxToppings,
          pizzaBase: cartItemData.pizzaBase
        });
      }

      await prisma.cartItem.create({ data: cartItemData });
    }

    // Return updated cart
    const updatedCartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        pizza: true,
        cartToppings: true,
        cartIngredients: true,
      },
    });

    const totalPrice = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { finalPrice: true },
    });
    console.log("Total Price:", totalPrice);

    const totalQuantity = await prisma.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { quantity: true },
    });

    return res.json({
      items: updatedCartItems,
      totalPrice: totalPrice._sum.finalPrice || 0,
      totalQuantity: totalQuantity._sum.quantity || 0,
    });
  } catch (err) {
    console.error("AddToCart error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
