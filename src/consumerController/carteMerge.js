// import { PrismaClient } from "@prisma/client";
// import { authenticateUser } from "../middleware/authMiddleware.js";
// import { updateCartTotal } from "../services/cartService.js";

// const prisma = new PrismaClient();

// // Helper to normalize arrays for comparison
// function normalize(arr) {
//   return [...arr].sort((a, b) => a.id - b.id);
// }

// // Check if two arrays of {id, quantity} match
// function arraysMatch(arr1, arr2) {
//   const norm1 = normalize(arr1);
//   const norm2 = normalize(arr2);
//   if (norm1.length !== norm2.length) return false;
//   return norm1.every(
//     (item, i) => item.id === norm2[i].id && item.quantity === norm2[i].quantity
//   );
// }

// // Check if two cart items match
// function itemsMatch(a, b) {
//   if (b.isCombo) {
//     return a.comboId === b.id;
//   }
//   if (b.isOtherItem) {
//     return a.otherItemId === b.id;
//   }
//   return (
//     a.pizzaId === b.pizzaId &&
//     a.size === b.size &&
//     arraysMatch(a.toppings, b.toppings) &&
//     arraysMatch(a.ingredients, b.ingredients)
//   );
// }

// export default async function syncCart(req, res) {
//   console.log("Sync Cart hit");

//   try {
//     // Authenticate user manually
//     await new Promise((resolve, reject) => {
//       authenticateUser(req, res, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });

//     const userId = req.user.id;
//     const localItems = req.body.cartItems || [];

//     console.log("Received localItems:", localItems);
//     console.log("User ID:", userId);

//     // Find or create cart
//     let cart = await prisma.cart.findFirst({
//       where: { userId },
//       include: {
//         cartItems: {
//           include: {
//             pizza: true,
//             combo: true,
//             otherItem: true,
//             cartToppings: true,
//             cartIngredients: true,
//           },
//         },
//       },
//     });

//     if (!cart) {
//       cart = await prisma.cart.create({
//         data: { userId },
//       });

//       // Re-fetch cart to include cartItems
//       cart = await prisma.cart.findUnique({
//         where: { id: cart.id },
//         include: {
//           cartItems: {
//             include: {
//               pizza: true,
//               combo: true,
//               otherItem: true,
//               cartToppings: true,
//               cartIngredients: true,
//             },
//           },
//         },
//       });
//     }

//     const updatedItems = [...(cart.cartItems || [])];

//     for (const localItem of localItems) {
//       const pizzaId = localItem.pizzaId || localItem.pizza?.id || localItem.id;
//       if (!pizzaId) {
//         console.warn("Skipping item with missing pizzaId:", localItem);
//         continue;
//       }

//       const toppings =
//         localItem.toppings ||
//         localItem.cartToppings?.map((t) => ({
//           id: t.toppingId,
//           quantity: t.addedQuantity,
//         })) ||
//         [];

//       const ingredients =
//         localItem.ingredients ||
//         localItem.cartIngredients?.map((i) => ({
//           id: i.ingredientId,
//           quantity: i.addedQuantity,
//         })) ||
//         [];

//       const existing = cart.cartItems.find((item) =>
//         itemsMatch(
//           {
//             pizzaId: item.pizzaId,
//             size: item.size,
//             toppings: item.cartToppings.map((t) => ({
//               id: t.toppingId,
//               quantity: t.addedQuantity,
//             })),
//             ingredients: item.cartIngredients.map((i) => ({
//               id: i.ingredientId,
//               quantity: i.addedQuantity,
//             })),
//           },
//           {
//             pizzaId,
//             size: localItem.size,
//             toppings,
//             ingredients,
//           }
//         )
//       );

//       const finalPrice =
//         Number(localItem.price) || Number(localItem.finalPrice) || 0;
//       const eachPrice =
//         Number(localItem.eachprice) || Number(localItem.basePrice) || 0;

//       if (existing) {
//         const updatedItem = await prisma.cartItem.update({
//           where: { id: existing.id },
//           data: {
//             quantity: { increment: localItem.quantity },
//             finalPrice: Number(existing.finalPrice) + Number(finalPrice), // <--- this line
//           },
//         });

//         // Replace the item in the updatedItems array
//         const index = updatedItems.findIndex((i) => i.id === existing.id);
//         if (index !== -1) updatedItems[index] = updatedItem;
//       } else if (localItem.isCombo) {
//         const newItem = await prisma.cartItem.create({
//           data: {
//             cartId: cart.id,
//             comboId: localItem.id,
//             pizzaId: null,
//             size: "COMBO",
//             quantity: localItem.quantity,
//             basePrice: Number(localItem.eachprice),
//             // Fix: Multiply finalPrice by quantity for combos
//             finalPrice: Number(localItem.eachprice) * localItem.quantity,
//             isCombo: true,
//           },
//         });
//         updatedItems.push(newItem);
//       } else if (localItem.isOtherItem) {
//         const newItem = await prisma.cartItem.create({
//           data: {
//             cartId: cart.id,
//             otherItemId: localItem.id,
//             pizzaId: null,
//             comboId: null,
//             size: "OTHER",
//             quantity: localItem.quantity,
//             basePrice: Number(localItem.eachprice),
//             finalPrice: Number(localItem.eachprice) * localItem.quantity,
//             isOtherItem: true,
//           },
//         });
//         updatedItems.push(newItem);
//       } else {
//         const newItem = await prisma.cartItem.create({
//           data: {
//             cartId: cart.id,
//             pizzaId: pizzaId,
//             comboId: null, // Set comboId to null for regular pizzas
//             size: localItem.size,
//             quantity: localItem.quantity,
//             basePrice: eachPrice,
//             finalPrice: finalPrice,
//             cartToppings: {
//               create: toppings.map((t) => ({
//                 toppingId: t.id,
//                 defaultQuantity: 0,
//                 addedQuantity: t.quantity,
//               })),
//             },
//             cartIngredients: {
//               create: ingredients.map((i) => ({
//                 ingredientId: i.id,
//                 defaultQuantity: 0,
//                 addedQuantity: i.quantity,
//               })),
//             },
//           },
//           include: {
//             cartToppings: true,
//             cartIngredients: true,
//           },
//         });
//         updatedItems.push(newItem);
//       }
//     }

//     // Add these debug logs after processing items
//     console.log(
//       "Cart Items after processing:",
//       updatedItems.map((item) => ({
//         finalPrice: item.finalPrice,
//         quantity: item.quantity,
//       }))
//     );

//     // Replace existing console logs with this simpler version
//     const totalPrice = await prisma.cartItem.aggregate({
//       where: { cartId: cart.id },
//       _sum: { finalPrice: true },
//     });

//     // Add this simple console log for final price
//     console.log(
//       "Cart Final Total: $",
//       Number(totalPrice._sum.finalPrice).toFixed(2)
//     );

//     // Update cart total - do this only once
//     const updatedCart = await prisma.cart.update({
//       where: { id: cart.id },
//       data: {
//         totalAmount: totalPrice._sum.finalPrice || 0,
//         createdAt: new Date(),
//       },
//     });

//     const totalQuantity = await prisma.cartItem.aggregate({
//       where: { cartId: cart.id },
//       _sum: { quantity: true },
//     });

//     res.json({
//       items: updatedItems,
//       totalQuantity: totalQuantity._sum.quantity || 0,
//       totalPrice: totalPrice._sum.finalPrice || 0,
//     });
//   } catch (err) {
//     console.error("Error in syncCart:", err);
//     res.status(500).json({ error: "Internal server error during cart sync." });
//   }
// }







// import { PrismaClient } from "@prisma/client";
// import { authenticateUser } from "../middleware/authMiddleware.js";

// // Optimize Prisma client with connection pooling
// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL,
//     },
//   },
//   // Reduce connection pool to prevent overwhelming the database
//   __internal: {
//     engine: {
//       connectionLimit: 10,
//     },
//   },
// });

// // Helper to normalize arrays for comparison
// function normalize(arr) {
//   return [...arr].sort((a, b) => a.id - b.id);
// }

// // Check if two arrays of {id, quantity} match
// function arraysMatch(arr1, arr2) {
//   const norm1 = normalize(arr1);
//   const norm2 = normalize(arr2);
//   if (norm1.length !== norm2.length) return false;
//   return norm1.every(
//     (item, i) => item.id === norm2[i].id && item.quantity === norm2[i].quantity
//   );
// }

// // FIXED: Check if two cart items match
// function itemsMatch(existingItem, localItem) {
//   // For combo items
//   if (localItem.isCombo) {
//     return existingItem.comboId === localItem.id && existingItem.isCombo;
//   }
  
//   // For other items
//   if (localItem.isOtherItem) {
//     return existingItem.otherItemId === localItem.id && existingItem.isOtherItem;
//   }
  
//   // For pizza items - check pizza ID, size, toppings, and ingredients
//   const pizzaId = localItem.pizzaId || localItem.pizza?.id || localItem.id;
  
//   return (
//     existingItem.pizzaId === pizzaId &&
//     existingItem.size === localItem.size &&
//     arraysMatch(
//       existingItem.toppings || [],
//       localItem.toppings || []
//     ) &&
//     arraysMatch(
//       existingItem.ingredients || [],
//       localItem.ingredients || []
//     ) &&
//     !existingItem.isCombo &&
//     !existingItem.isOtherItem
//   );
// }

// export default async function syncCart(req, res) {
//   console.log("Sync Cart hit");

//   try {
//     // Authenticate user manually
//     await new Promise((resolve, reject) => {
//       authenticateUser(req, res, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });

//     const userId = req.user.id;
//     const localItems = req.body.cartItems || [];

//     console.log("Received localItems:", localItems);
//     console.log("User ID:", userId);

//     // OPTIMIZATION 1: Find existing cart or create new one efficiently
//     let cart = await prisma.cart.findFirst({
//       where: { userId },
//       include: {
//         cartItems: {
//           include: {
//             pizza: true,
//             combo: true,
//             otherItem: true,
//             cartToppings: true,
//             cartIngredients: true,
//           },
//         },
//       },
//     });

//     // Create cart if it doesn't exist
//     if (!cart) {
//       cart = await prisma.cart.create({
//         data: { userId },
//         include: {
//           cartItems: {
//             include: {
//               pizza: true,
//               combo: true,
//               otherItem: true,
//               cartToppings: true,
//               cartIngredients: true,
//             },
//           },
//         },
//       });
//     }

//     // OPTIMIZATION 2: Batch process items - prepare all operations first
//     const itemsToUpdate = [];
//     const itemsToCreate = [];

//     for (const localItem of localItems) {
//       // FIXED: Better handling of different item types
//       let pizzaId = null;
//       if (!localItem.isCombo && !localItem.isOtherItem) {
//         pizzaId = localItem.pizzaId || localItem.pizza?.id || localItem.id;
//         if (!pizzaId) {
//           console.warn("Skipping pizza item with missing pizzaId:", localItem);
//           continue;
//         }
//       }

//       const toppings =
//         localItem.toppings ||
//         localItem.cartToppings?.map((t) => ({
//           id: t.toppingId,
//           quantity: t.addedQuantity,
//         })) ||
//         [];

//       const ingredients =
//         localItem.ingredients ||
//         localItem.cartIngredients?.map((i) => ({
//           id: i.ingredientId,
//           quantity: i.addedQuantity,
//         })) ||
//         [];

//       // FIXED: Find existing item with proper matching logic
//       const existing = cart.cartItems.find((item) => {
//         const itemWithToppingsAndIngredients = {
//           ...item,
//           toppings: item.cartToppings?.map((t) => ({
//             id: t.toppingId,
//             quantity: t.addedQuantity,
//           })) || [],
//           ingredients: item.cartIngredients?.map((i) => ({
//             id: i.ingredientId,
//             quantity: i.addedQuantity,
//           })) || [],
//         };
        
//         return itemsMatch(itemWithToppingsAndIngredients, localItem);
//       });

//       const finalPrice =
//         Number(localItem.price) || Number(localItem.finalPrice) || 0;
//       const eachPrice =
//         Number(localItem.eachprice) || Number(localItem.basePrice) || 0;

//       if (existing) {
//         // FIXED: Update existing item quantities
//         itemsToUpdate.push({
//           id: existing.id,
//           quantity: existing.quantity + localItem.quantity,
//           finalPrice: Number(existing.finalPrice) + Number(finalPrice),
//         });
//       } else {
//         // FIXED: Create new item with proper data structure
//         if (localItem.isCombo) {
//           itemsToCreate.push({
//             cartId: cart.id,
//             comboId: localItem.id,
//             pizzaId: null,
//             otherItemId: null,
//             size: "COMBO",
//             quantity: localItem.quantity,
//             basePrice: Number(localItem.eachprice || 0),
//             finalPrice: Number(localItem.eachprice || 0) * localItem.quantity,
//             isCombo: true,
//             isOtherItem: false,
//             toppings: [],
//             ingredients: [],
//           });
//         } else if (localItem.isOtherItem) {
//           itemsToCreate.push({
//             cartId: cart.id,
//             otherItemId: localItem.id,
//             pizzaId: null,
//             comboId: null,
//             size: "OTHER",
//             quantity: localItem.quantity,
//             basePrice: Number(localItem.eachprice || 0),
//             finalPrice: Number(localItem.eachprice || 0) * localItem.quantity,
//             isCombo: false,
//             isOtherItem: true,
//             toppings: [],
//             ingredients: [],
//           });
//         } else {
//           itemsToCreate.push({
//             cartId: cart.id,
//             pizzaId: pizzaId,
//             comboId: null,
//             otherItemId: null,
//             size: localItem.size,
//             quantity: localItem.quantity,
//             basePrice: eachPrice,
//             finalPrice: finalPrice,
//             isCombo: false,
//             isOtherItem: false,
//             toppings: toppings,
//             ingredients: ingredients,
//           });
//         }
//       }
//     }

//     // OPTIMIZATION 3: Execute all operations in a single efficient transaction
//     const result = await prisma.$transaction(async (tx) => {
//       // Batch update existing items
//       const updatePromises = itemsToUpdate.map(item =>
//         tx.cartItem.update({
//           where: { id: item.id },
//           data: {
//             quantity: item.quantity,
//             finalPrice: item.finalPrice,
//           },
//         })
//       );

//       // Batch create new items
//       const createPromises = itemsToCreate.map(item => {
//         if (item.toppings.length > 0 || item.ingredients.length > 0) {
//           // Create pizza items with toppings/ingredients
//           return tx.cartItem.create({
//             data: {
//               cartId: item.cartId,
//               pizzaId: item.pizzaId,
//               comboId: item.comboId,
//               otherItemId: item.otherItemId,
//               size: item.size,
//               quantity: item.quantity,
//               basePrice: item.basePrice,
//               finalPrice: item.finalPrice,
//               isCombo: item.isCombo,
//               isOtherItem: item.isOtherItem,
//               cartToppings: {
//                 create: item.toppings.map((t) => ({
//                   toppingId: t.id,
//                   defaultQuantity: 0,
//                   addedQuantity: t.quantity,
//                 })),
//               },
//               cartIngredients: {
//                 create: item.ingredients.map((i) => ({
//                   ingredientId: i.id,
//                   defaultQuantity: 0,
//                   addedQuantity: i.quantity,
//                 })),
//               },
//             },
//             include: {
//               cartToppings: true,
//               cartIngredients: true,
//             },
//           });
//         } else {
//           // Create simple items (combos, other items)
//           return tx.cartItem.create({
//             data: {
//               cartId: item.cartId,
//               pizzaId: item.pizzaId,
//               comboId: item.comboId,
//               otherItemId: item.otherItemId,
//               size: item.size,
//               quantity: item.quantity,
//               basePrice: item.basePrice,
//               finalPrice: item.finalPrice,
//               isCombo: item.isCombo,
//               isOtherItem: item.isOtherItem,
//             },
//           });
//         }
//       });

//       // Execute all updates and creates in parallel
//       const [updatedItems, createdItems] = await Promise.all([
//         Promise.all(updatePromises),
//         Promise.all(createPromises),
//       ]);

//       // OPTIMIZATION 4: Single aggregation query for totals
//       const [totalPrice, totalQuantity] = await Promise.all([
//         tx.cartItem.aggregate({
//           where: { cartId: cart.id },
//           _sum: { finalPrice: true },
//         }),
//         tx.cartItem.aggregate({
//           where: { cartId: cart.id },
//           _sum: { quantity: true },
//         }),
//       ]);

//       // Update cart total - single operation
//       await tx.cart.update({
//         where: { id: cart.id },
//         data: {
//           totalAmount: totalPrice._sum.finalPrice || 0,
//         },
//       });

//       return {
//         updatedItems,
//         createdItems,
//         totalPrice: totalPrice._sum.finalPrice || 0,
//         totalQuantity: totalQuantity._sum.quantity || 0,
//       };
//     }, {
//       // Set transaction timeout to prevent hanging
//       timeout: 10000, // 10 seconds
//     });

//     console.log(
//       "Cart Items processed:",
//       `Updated: ${result.updatedItems.length}, Created: ${result.createdItems.length}`
//     );

//     console.log(
//       "Cart Final Total: $",
//       Number(result.totalPrice).toFixed(2)
//     );

//     // OPTIMIZATION 5: Return combined results without additional DB queries
//     const allItems = [...result.updatedItems, ...result.createdItems];

//     res.json({
//       items: allItems,
//       totalQuantity: result.totalQuantity,
//       totalPrice: result.totalPrice,
//     });

//   } catch (err) {
//     console.error("Error in syncCart:", err);
    
//     // Handle specific database connection errors
//     if (err.message.includes("Can't reach database server")) {
//       return res.status(503).json({ 
//         error: "Database temporarily unavailable. Please try again in a moment." 
//       });
//     }
    
//     if (err.code === 'P2024') { // Transaction timeout
//       return res.status(408).json({ 
//         error: "Request timeout. Please try again with fewer items." 
//       });
//     }
    
//     res.status(500).json({ 
//       error: "Internal server error during cart sync.",
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// }




// SECURE CART MERGE WITH PIZZA BUILDER VALIDATION
// ================================================
// This module handles secure cart synchronization with comprehensive validation:
// 1. Regular pizzas: Size-based pricing with topping/ingredient multipliers
// 2. Combo items: Fixed pricing validation
// 3. Other items: Price validation with sauce support
// 4. Combo style items: Meal deal vs regular pricing
// 5. **NEW: User Choice Items (Pizza Builder)**:
//    - Validates maximum topping limits (default: 4 toppings)
//    - Calculates additional costs for extra toppings beyond limit
//    - Applies size multipliers to extra topping costs
//    - Securely validates all selected toppings exist in database
//    - Prevents price tampering for Pizza Builder items

import { PrismaClient } from "@prisma/client";
import { authenticateUser } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  __internal: {
    engine: {
      connectionLimit: 10,
    },
  },
});

// Helper to normalize arrays for comparison
function normalize(arr) {
  return [...arr].sort((a, b) => a.id - b.id);
}

// Check if two arrays of {id, quantity} match
function arraysMatch(arr1, arr2) {
  const norm1 = normalize(arr1);
  const norm2 = normalize(arr2);
  if (norm1.length !== norm2.length) return false;
  return norm1.every(
    (item, i) => item.id === norm2[i].id && item.quantity === norm2[i].quantity
  );
}

// Function to get size multiplier for dynamic topping pricing - BACKEND VALIDATION
function getSizeMultiplier(size) {
  switch (size) {
    case "Large":
      return 1.5; // 50% extra
    case "Super Size":
      return 2; // 100% extra
    case "Medium":
    default:
      return 1; // Medium is base
  }
}

// Enhanced item matching logic that considers pizzaBase and user choice selections
function itemsMatch(existingItem, localItem) {
  // **NEW: For Pizza Builder items**
  if (localItem.isPizzaBuilder || localItem.type === 'pizzaBuilder' || localItem.pizzaBuilderDealId) {
    const existingPizzaBuilderDealId = existingItem.pizzaBuilderDealId;
    const localPizzaBuilderDealId = localItem.pizzaBuilderDealId || localItem.id;
    
    return existingPizzaBuilderDealId === localPizzaBuilderDealId &&
           existingItem.size === (localItem.size || 'Medium') &&
           existingItem.pizzaBase === (localItem.pizzaBase || localItem.selectedItems?.base || 'Regular Crust') &&
           JSON.stringify(existingItem.sauce || '') === JSON.stringify(localItem.sauce || localItem.selectedItems?.sauce || '') &&
           // Compare toppings (use cleaned toppings if available)
           JSON.stringify((existingItem.toppings || []).sort()) === JSON.stringify((localItem.cleanedToppings || localItem.toppings || []).sort());
  }
  
  // For user choice items (including Pizza Builder)
  if (localItem.type === 'userChoice') {
    return existingItem.userChoiceId === localItem.id &&
           existingItem.size === (localItem.size || 'Regular') &&
           JSON.stringify(existingItem.userChoiceSelections || {}) === JSON.stringify(localItem.selectedItems || {});
  }
  
  // For combo style items
  if (localItem.comboStyleItemId) {
    return existingItem.comboStyleItemId === localItem.comboStyleItemId &&
           existingItem.size === localItem.size &&
           existingItem.isMealDeal === (localItem.isMealDeal || false) &&
           existingItem.selectedSides === (localItem.selectedSides || null) &&
           existingItem.selectedDrinks === (localItem.selectedDrinks || null) &&
           existingItem.sauce === (localItem.sauce || null);
  }
  
  // For combo items
  if (localItem.isCombo) {
    return existingItem.comboId === localItem.id && existingItem.isCombo;
  }
  
  // For other items
  if (localItem.isOtherItem) {
    return existingItem.otherItemId === localItem.id && 
           existingItem.isOtherItem &&
           existingItem.sauce === (localItem.sauce || null); // Include sauce in matching
  }
  
  // For pizza items - check pizza ID, size, pizzaBase, toppings, and ingredients
  const pizzaId = localItem.pizzaId || localItem.pizza?.id || localItem.id;
  
  return (
    existingItem.pizzaId === pizzaId &&
    existingItem.size === localItem.size &&
    normalizePizzaBase(existingItem.pizzaBase) === normalizePizzaBase(localItem.pizzaBase) &&
    arraysMatch(
      existingItem.toppings || [],
      localItem.toppings || []
    ) &&
    arraysMatch(
      existingItem.ingredients || [],
      localItem.ingredients || []
    ) &&
    !existingItem.isCombo &&
    !existingItem.isOtherItem &&
    !existingItem.comboStyleItemId &&
    !existingItem.userChoiceId
  );
}

// SECURE: Calculate actual price on backend - NEVER trust frontend
// Update the calculateSecurePrice function - around line 110-180:

// SECURE: Calculate actual price on backend - NEVER trust frontend
// async function calculateSecurePrice(localItem) {
//   try {
//     console.log(`🔒 SECURITY: Calculating secure price for item: ${localItem.title || localItem.name}`);
    
//     // For combo items
//     if (localItem.isCombo) {
//       const combo = await prisma.comboOffers.findUnique({
//         where: { id: localItem.id }
//       });
      
//       if (!combo) {
//         throw new Error(`Combo not found: ${localItem.id}`);
//       }
      
//       const comboPrice = Number(combo.price) * localItem.quantity;
//       console.log(`💰 Combo price calculated: £${comboPrice.toFixed(2)}`);
//       return comboPrice;
//     }
    
//     // For other items
//     if (localItem.isOtherItem) {
//       const otherItem = await prisma.otherItem.findUnique({
//         where: { id: localItem.id }
//       });
      
//       if (!otherItem) {
//         throw new Error(`Other item not found: ${localItem.id}`);
//       }
      
//       const otherPrice = Number(otherItem.price) * localItem.quantity;
//       console.log(`💰 Other item price calculated: £${otherPrice.toFixed(2)}`);
//       return otherPrice;
//     }
    
//     // For pizza items - SECURE CALCULATION
//     const pizzaId = localItem.pizzaId || localItem.pizza?.id || localItem.id;
    
//     const pizza = await prisma.pizza.findUnique({
//       where: { id: pizzaId },
//       include: {
//         defaultToppings: {
//           include: {
//             topping: true
//           }
//         },
//         defaultIngredients: {
//           include: {
//             ingredient: true
//           }
//         },
//       }
//     });
    
//     if (!pizza) {
//       throw new Error(`Pizza not found: ${pizzaId}`);
//     }
    
//     // Get base price from database
//     const sizes = typeof pizza.sizes === "string" ? JSON.parse(pizza.sizes) : pizza.sizes;
//     let basePrice = Number(sizes.MEDIUM || 0); // Medium is base
    
//     // Add size difference to base price
//     const size = localItem.size || "Medium";
//     switch (size) {
//       case "Large":
//         basePrice += (Number(sizes.LARGE || 0) - Number(sizes.MEDIUM || 0));
//         break;
//       case "Super Size":
//         basePrice += (Number(sizes.LARGE || 0) * 1.5 - Number(sizes.MEDIUM || 0));
//         break;
//       default:
//         // Medium stays as base
//         break;
//     }
    
//     console.log(`🍕 Pizza base price for ${size}: £${basePrice.toFixed(2)}`);
    
//     // Calculate topping costs with size multiplier - ONLY TOPPINGS GET MULTIPLIER
//     let toppingCost = 0;
//     const sizeMultiplier = getSizeMultiplier(size);
    
//     const toppings = localItem.toppings || [];
    
//     for (const topping of toppings) {
//       if (topping.quantity > 0) {
//         // Validate topping exists and get real price from database
//         const toppingData = await prisma.toppingsList.findUnique({
//           where: { id: topping.id }
//         });
        
//         if (!toppingData) {
//           console.warn(`⚠️ Invalid topping ID: ${topping.id}`);
//           continue; // Skip invalid toppings
//         }
        
//         // Calculate price difference from default
//         const defaultTopping = pizza.defaultToppings?.find(dt => dt.toppingId === topping.id);
//         const defaultQuantity = defaultTopping ? defaultTopping.quantity : 0;
//         const addedQuantity = Math.max(0, topping.quantity - defaultQuantity);
        
//         if (addedQuantity > 0) {
//           const realToppingPrice = Number(toppingData.price) * sizeMultiplier; // ✅ Apply size multiplier
//           const toppingCostAdded = realToppingPrice * addedQuantity;
//           toppingCost += toppingCostAdded;
          
//           console.log(`🧄 Topping: ${toppingData.name}, Added: ${addedQuantity}, Base Price: £${toppingData.price}, Multiplier: ${sizeMultiplier}x, Adjusted: £${realToppingPrice.toFixed(2)}, Total: £${toppingCostAdded.toFixed(2)}`);
//         }
//       }
//     }
    
//     // Calculate ingredient costs - NO SIZE MULTIPLIER FOR INGREDIENTS
//     let ingredientCost = 0;
//     const ingredients = localItem.ingredients || [];
    
//     for (const ingredient of ingredients) {
//       if (ingredient.quantity > 0) {
//         // Validate ingredient exists and get real price from database
//         const ingredientData = await prisma.ingredientsList.findUnique({
//           where: { id: ingredient.id }
//         });
        
//         if (!ingredientData) {
//           console.warn(`⚠️ Invalid ingredient ID: ${ingredient.id}`);
//           continue; // Skip invalid ingredients
//         }
        
//         // Calculate price difference from default
//         const defaultIngredient = pizza.defaultIngredients?.find(di => di.ingredientId === ingredient.id);
//         const defaultQuantity = defaultIngredient ? defaultIngredient.quantity : 0;
//         const addedQuantity = Math.max(0, ingredient.quantity - defaultQuantity);
        
//         if (addedQuantity > 0) {
//           const realIngredientPrice = Number(ingredientData.price); // ✅ NO size multiplier for ingredients
//           const ingredientCostAdded = realIngredientPrice * addedQuantity;
//           ingredientCost += ingredientCostAdded;
          
//           console.log(`🥬 Ingredient: ${ingredientData.name}, Added: ${addedQuantity}, Price: £${realIngredientPrice.toFixed(2)} (NO multiplier), Total: £${ingredientCostAdded.toFixed(2)}`);
//         }
//       }
//     }
    
//     const totalItemPrice = basePrice + toppingCost + ingredientCost;
//     const finalPrice = totalItemPrice * localItem.quantity;
    
//     console.log(`🔒 SECURE CALCULATION COMPLETE:`);
//     console.log(`   Base: £${basePrice.toFixed(2)}`);
//     console.log(`   Toppings: £${toppingCost.toFixed(2)} (WITH ${sizeMultiplier}x multiplier for ${size})`);
//     console.log(`   Ingredients: £${ingredientCost.toFixed(2)} (NO multiplier)`);
//     console.log(`   Per Item: £${totalItemPrice.toFixed(2)}`);
//     console.log(`   Quantity: ${localItem.quantity}`);
//     console.log(`   FINAL PRICE: £${finalPrice.toFixed(2)}`);
    
//     // Compare with frontend price for security logging
//     const frontendPrice = Number(localItem.price || 0);
//     if (Math.abs(frontendPrice - finalPrice) > 0.01) {
//       console.warn(`🚨 SECURITY ALERT: Price mismatch detected!`);
//       console.warn(`   Frontend claimed: £${frontendPrice.toFixed(2)}`);
//       console.warn(`   Backend calculated: £${finalPrice.toFixed(2)}`);
//       console.warn(`   Difference: £${(frontendPrice - finalPrice).toFixed(2)}`);
//     } else {
//       console.log(`✅ Price validation passed - Frontend and backend prices match!`);
//     }
    
//     return finalPrice;
    
//   } catch (error) {
//     console.error("🚨 Error in secure price calculation:", error);
//     throw new Error(`Failed to calculate secure price: ${error.message}`);
//   }
// }


// Add this constant at the top of the file for security with dynamic stuffed crust pricing
const VALID_PIZZA_BASES = {
  "Regular Crust": 0,
  "ThinCrust": 0,
  "Thin Crust": 0, // Add alternative naming
  "Stuffed Crust +2£": (size) => {
    // Dynamic stuffed crust pricing based on size
    switch (size) {
      case "Large":
        return 3; // £3 for large
      case "Super Size":
        return 4; // £4 for super size
      case "Medium":
      default:
        return 2; // £2 for medium
    }
  }
};

// Helper function to normalize pizza base names from frontend
function normalizePizzaBase(pizzaBase) {
  if (!pizzaBase) return "Regular Crust";
  
  // Handle dynamic frontend labeling for stuffed crust
  if (pizzaBase.includes("Stuffed Crust")) {
    return "Stuffed Crust +2£"; // Normalize to backend key
  }
  
  // Handle other variations
  if (pizzaBase === "ThinCrust") return "Thin Crust";
  
  return pizzaBase;
}

// Update the calculateSecurePrice function
// Update the calculateSecurePrice function to match frontend logic
async function calculateSecurePrice(localItem) {
  try {
    console.log(`🔒 SECURITY: Calculating secure price for item: ${localItem.title || localItem.name}`);
    
    // For combo style items
    if (localItem.comboStyleItemId) {
      console.log(`🍗 Processing combo style item: ${localItem.comboStyleItemId}`);
      const comboStyleItem = await prisma.comboStyleItem.findUnique({
        where: { id: localItem.comboStyleItemId }
      });
      
      if (!comboStyleItem || !comboStyleItem.isActive) {
        throw new Error(`Combo style item not found: ${localItem.comboStyleItemId}`);
      }
      
      // Parse size pricing
      const sizePricing = typeof comboStyleItem.sizePricing === 'string' 
        ? JSON.parse(comboStyleItem.sizePricing) 
        : comboStyleItem.sizePricing;
      
      const size = localItem.size;
      if (!sizePricing[size]) {
        throw new Error(`Invalid size ${size} for combo style item ${localItem.comboStyleItemId}`);
      }
      
      const sizeConfig = sizePricing[size];
      let unitPrice;
      
      if (localItem.isMealDeal) {
        unitPrice = parseFloat(sizeConfig.mealDealPrice || sizeConfig.basePrice);
      } else {
        unitPrice = parseFloat(sizeConfig.basePrice);
      }
      
      const totalPrice = unitPrice * localItem.quantity;
      console.log(`💰 Combo style item price calculated: £${totalPrice.toFixed(2)} (${localItem.quantity} x £${unitPrice.toFixed(2)})`);
      return totalPrice;
    }
    
    // For combo items
    if (localItem.isCombo) {
      const combo = await prisma.comboOffers.findUnique({
        where: { id: localItem.id }
      });
      
      if (!combo) {
        throw new Error(`Combo not found: ${localItem.id}`);
      }
      
      const comboPrice = Number(combo.price) * localItem.quantity;
      console.log(`💰 Combo price calculated: £${comboPrice.toFixed(2)}`);
      return comboPrice;
    }
    
    // For other items
    if (localItem.isOtherItem) {
      const otherItem = await prisma.otherItem.findUnique({
        where: { id: localItem.id }
      });
      
      if (!otherItem) {
        throw new Error(`Other item not found: ${localItem.id}`);
      }
      
      const otherPrice = Number(otherItem.price) * localItem.quantity;
      console.log(`💰 Other item price calculated: £${otherPrice.toFixed(2)}`);
      return otherPrice;
    }

    // **ENHANCED: Pizza Builder detection and processing**
    const isPizzaBuilderItem = localItem.isPizzaBuilder || 
                              localItem.type === 'pizzaBuilder' || 
                              localItem.pizzaBuilderDealId ||
                              (localItem.type === 'userChoice' && localItem.selectedItems?.toppings);
    
    if (isPizzaBuilderItem) {
      console.log(`🍕 PIZZA BUILDER: Processing Pizza Builder item`);
      
      // Get the Pizza Builder deal ID
      const pizzaBuilderDealId = localItem.pizzaBuilderDealId || localItem.id;
      
      // Get Pizza Builder deal from database
      const pizzaBuilderDeal = await prisma.pizzaBuilderDeal.findUnique({
        where: { id: pizzaBuilderDealId }
      });
      
      if (!pizzaBuilderDeal || !pizzaBuilderDeal.isActive) {
        throw new Error(`Pizza Builder deal not found or inactive: ${pizzaBuilderDealId}`);
      }
      
      console.log(`🍕 PIZZA BUILDER: Found deal "${pizzaBuilderDeal.name}" with max ${pizzaBuilderDeal.maxToppings} toppings`);
      
      // Get base price for the selected size
      const size = localItem.size || "Medium";
      let basePrice = 0;
      
      switch (size) {
        case "Large":
          basePrice = Number(pizzaBuilderDeal.largePrice) || 0;
          break;
        case "Super Size":
          basePrice = Number(pizzaBuilderDeal.superSizePrice) || 0;
          break;
        default: // Medium
          basePrice = Number(pizzaBuilderDeal.mediumPrice) || 0;
          break;
      }
      
      // **FIXED: Ensure base price is valid**
      if (isNaN(basePrice) || basePrice <= 0) {
        basePrice = 10; // Default base price if no price set
        console.log(`⚠️ PIZZA BUILDER: No valid base price found for ${size}, using default £${basePrice}`);
      }
      
      console.log(`🍕 PIZZA BUILDER: Base price for ${size}: £${basePrice.toFixed(2)}`);
      
      // Calculate topping costs - SECURITY: Only charge for extras beyond maxToppings
      let toppingCost = 0;
      const maxToppings = pizzaBuilderDeal.maxToppings;
      
      // Handle both frontend formats: direct toppings array or selectedItems.toppings
      const receivedToppings = localItem.toppings || localItem.selectedItems?.toppings || [];
      
      // **FIXED: Only process toppings that are actually selected (quantity > 0)**
      const selectedToppings = receivedToppings.filter(topping => 
        topping.quantity && topping.quantity > 0
      );
      
      console.log(`🍕 PIZZA BUILDER: Received ${receivedToppings.length} toppings, ${selectedToppings.length} actually selected`);
      console.log(`🍕 PIZZA BUILDER: Selected toppings:`, selectedToppings.map(t => `${t.name}(${t.quantity})`).join(', '));
      
      // **SECURITY: Filter out invalid toppings before processing**
      const validToppings = [];
      for (const topping of selectedToppings) {
        // Skip obviously invalid topping IDs (fallback, null, undefined, etc.)
        if (!topping.id || 
            topping.id.includes('fallback') || 
            topping.id === 'null' || 
            topping.id === 'undefined' ||
            topping.id.length < 10) { // Valid Prisma IDs are typically 25+ chars
          console.log(`⚠️ PIZZA BUILDER: Skipping invalid topping ID: ${topping.id}`);
          continue;
        }
        
        // Validate topping exists in database
        const toppingData = await prisma.toppingsList.findUnique({
          where: { id: topping.id }
        });
        
        if (!toppingData) {
          console.log(`⚠️ PIZZA BUILDER: Skipping unknown topping ID: ${topping.id}`);
          continue;
        }
        
        // Check if this topping is allowed for this Pizza Builder
        // Handle both old array format and new {id: name} format
        let isAllowedTopping = false;
        if (Array.isArray(pizzaBuilderDeal.availableToppings)) {
          // Old format: ["name1", "name2"]
          isAllowedTopping = pizzaBuilderDeal.availableToppings.includes(toppingData.name);
        } else if (typeof pizzaBuilderDeal.availableToppings === 'object' && pizzaBuilderDeal.availableToppings) {
          // New format: {id: "name"}
          isAllowedTopping = Object.values(pizzaBuilderDeal.availableToppings).includes(toppingData.name) ||
                           Object.keys(pizzaBuilderDeal.availableToppings).includes(toppingData.id);
        } else if (pizzaBuilderDeal.toppingsData && typeof pizzaBuilderDeal.toppingsData === 'object') {
          // Use toppingsData as fallback
          isAllowedTopping = Object.values(pizzaBuilderDeal.toppingsData).includes(toppingData.name) ||
                           Object.keys(pizzaBuilderDeal.toppingsData).includes(toppingData.id);
        }
        
        if (!isAllowedTopping) {
          console.log(`⚠️ PIZZA BUILDER: Skipping disallowed topping: ${toppingData.name} (ID: ${toppingData.id})`);
          continue;
        }
        
        validToppings.push({
          ...topping,
          toppingData: toppingData
        });
        
        console.log(`✅ PIZZA BUILDER: Valid topping - ${toppingData.name}`);
      }
      
      console.log(`🍕 PIZZA BUILDER: ${validToppings.length} valid toppings out of ${selectedToppings.length} submitted`);
      
      // Count total topping units from VALID toppings only
      const totalToppingUnits = validToppings.reduce((sum, topping) => sum + (topping.quantity || 1), 0);
      const extraToppings = Math.max(0, totalToppingUnits - maxToppings);
      
      console.log(`🍕 PIZZA BUILDER: Total topping units: ${totalToppingUnits}, Max free: ${maxToppings}, Extra: ${extraToppings}`);
      
      if (extraToppings > 0) {
        // Calculate size multiplier for pricing
        const sizeMultiplier = getSizeMultiplier(size);
        let extraUnitsRemaining = extraToppings;
        
        console.log(`💰 PIZZA BUILDER: Starting extra topping calculation - ${extraToppings} extra units to charge`);
        
        // Process VALID toppings to charge for extras
        for (let i = 0; i < validToppings.length; i++) {
          const validTopping = validToppings[i];
          console.log(`🔍 PIZZA BUILDER: Processing topping ${i + 1}/${validToppings.length}: ${validTopping.toppingData.name} (qty: ${validTopping.quantity}, remaining: ${extraUnitsRemaining})`);
          
          if (validTopping.quantity > 0 && extraUnitsRemaining > 0) {
            const toppingData = validTopping.toppingData;
            
            // **FIXED: Handle null/undefined topping prices with fallback**
            let toppingPrice = Number(toppingData.additionalToppingCost);
            if (isNaN(toppingPrice) || toppingPrice == null) {
              toppingPrice = 1; // Default topping price for Medium (will be multiplied by size)
              console.log(`⚠️ PIZZA BUILDER: No price found for ${toppingData.name}, using default £${toppingPrice}`);
            }
            
            const adjustedPrice = toppingPrice * sizeMultiplier;
            const unitsToCharge = Math.min(validTopping.quantity, extraUnitsRemaining);
            const toppingCostContribution = unitsToCharge * adjustedPrice;
            
            toppingCost += toppingCostContribution;
            extraUnitsRemaining -= unitsToCharge;
            
            console.log(`🧄 PIZZA BUILDER: Extra ${toppingData.name} x${unitsToCharge} = £${toppingCostContribution.toFixed(2)} (£${adjustedPrice.toFixed(2)} each with ${size} multiplier) - Remaining: ${extraUnitsRemaining}`);
          } else {
            console.log(`⏭️ PIZZA BUILDER: Skipping ${validTopping.toppingData.name} - qty: ${validTopping.quantity}, remaining: ${extraUnitsRemaining}`);
          }
          
          if (extraUnitsRemaining <= 0) {
            console.log(`✅ PIZZA BUILDER: All ${extraToppings} extra units charged, stopping loop`);
            break;
          }
        }
        
        console.log(`💰 PIZZA BUILDER: Total extra topping cost: £${toppingCost.toFixed(2)}`);
      }
      
      // Calculate stuffed crust cost if selected
      let stuffedCrustCost = 0;
      const pizzaBase = localItem.pizzaBase || localItem.selectedItems?.base || "Regular Crust";
      if (pizzaBase.includes("Stuffed Crust")) {
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
        console.log(`🍞 PIZZA BUILDER: Stuffed crust cost for ${size}: £${stuffedCrustCost.toFixed(2)}`);
      }
      
      // Calculate final price
      const finalPricePerItem = basePrice + toppingCost + stuffedCrustCost;
      const pizzaBuilderPrice = finalPricePerItem * localItem.quantity;
      
      console.log(`💰 PIZZA BUILDER: Final calculation:`);
      console.log(`   Base price (${size}): £${basePrice.toFixed(2)}`);
      console.log(`   Extra toppings: £${toppingCost.toFixed(2)}`);
      console.log(`   Stuffed crust: £${stuffedCrustCost.toFixed(2)}`);
      console.log(`   Per item total: £${finalPricePerItem.toFixed(2)}`);
      console.log(`   Quantity: ${localItem.quantity}`);
      console.log(`   Final total: £${pizzaBuilderPrice.toFixed(2)}`);
      console.log(`   Valid toppings processed: ${validToppings.length}/${selectedToppings.length}`);
      
      // Store cleaned toppings back to localItem for cart creation
      localItem.cleanedToppings = validToppings.map(vt => ({
        id: vt.id,
        quantity: vt.quantity || 1,
        name: vt.toppingData.name
      }));
      
      return pizzaBuilderPrice;
    }

    // **NEW: For user choice items with Pizza Builder validation**
    if (localItem.type === 'userChoice') {
      console.log(`🎯 Processing user choice item: ${localItem.id}`);
      const userChoice = await prisma.userChoice.findUnique({
        where: { id: localItem.id }
      });
      
      if (!userChoice || !userChoice.isActive) {
        throw new Error(`User choice not found: ${localItem.id}`);
      }
      
      // **NEW: Pizza Builder validation logic**
      let basePrice = Number(userChoice.basePrice);
      let additionalCost = 0;
      
      // Check if this is a Pizza Builder item (has selected toppings)
      if (localItem.selectedItems && localItem.selectedItems.toppings && Array.isArray(localItem.selectedItems.toppings)) {
        console.log(`🍕 Pizza Builder detected - validating toppings`);
        
        const selectedToppings = localItem.selectedItems.toppings;
        const maxToppings = localItem.maxToppings || 4; // Default to 4 if not specified
        const size = localItem.size || "Medium";
        const sizeMultiplier = getSizeMultiplier(size);
        
        console.log(`🍕 Pizza Builder details:`);
        console.log(`   - Selected toppings: ${selectedToppings.length}`);
        console.log(`   - Max allowed toppings: ${maxToppings}`);
        console.log(`   - Size: ${size} (multiplier: ${sizeMultiplier}x)`);
        
        // If toppings exceed the limit, calculate additional cost
        if (selectedToppings.length > maxToppings) {
          const extraToppings = selectedToppings.length - maxToppings;
          console.log(`🚨 Extra toppings detected: ${extraToppings} toppings beyond limit`);
          
          // Validate each extra topping and calculate cost
          for (let i = maxToppings; i < selectedToppings.length; i++) {
            const extraTopping = selectedToppings[i];
            
            // Validate topping exists in database
            const toppingData = await prisma.toppingsList.findUnique({
              where: { id: extraTopping.id }
            });
            
            if (!toppingData) {
              console.warn(`⚠️ Invalid extra topping ID: ${extraTopping.id}`);
              throw new Error(`Invalid topping selected: ${extraTopping.id}`);
            }
            
            // Calculate additional cost with size multiplier
            const toppingBasePrice = Number(toppingData.price);
            const toppingCostWithSize = toppingBasePrice * sizeMultiplier;
            additionalCost += toppingCostWithSize;
            
            console.log(`🧄 Extra topping: ${toppingData.name}, Base: £${toppingBasePrice.toFixed(2)}, With ${size} multiplier: £${toppingCostWithSize.toFixed(2)}`);
          }
          
          console.log(`💰 Total additional cost for extra toppings: £${additionalCost.toFixed(2)}`);
        } else {
          console.log(`✅ Topping count within limit (${selectedToppings.length}/${maxToppings}) - no additional charges`);
        }
        
        // Validate all selected toppings exist in database (security check)
        for (const topping of selectedToppings) {
          const toppingData = await prisma.toppingsList.findUnique({
            where: { id: topping.id }
          });
          
          if (!toppingData) {
            console.warn(`⚠️ Invalid topping ID in selection: ${topping.id}`);
            throw new Error(`Invalid topping selected: ${topping.id}`);
          }
        }
        
        console.log(`✅ All ${selectedToppings.length} toppings validated successfully`);
      }
      
      // Calculate final price with additional costs
      const finalPricePerItem = basePrice + additionalCost;
      const userChoicePrice = finalPricePerItem * localItem.quantity;
      
      // Validate against client price (with tolerance for extra toppings)
      const clientPrice = Number(localItem.price || localItem.totalPrice || localItem.basePrice);
      
      if (Math.abs(clientPrice - userChoicePrice) > 0.01) {
        console.warn(`🚨 SECURITY ALERT: Price mismatch for user choice ${userChoice.name}`);
        console.warn(`   Expected (base + extras): £${userChoicePrice.toFixed(2)}`);
        console.warn(`   Client sent: £${clientPrice.toFixed(2)}`);
        console.warn(`   Base price: £${basePrice.toFixed(2)}`);
        console.warn(`   Additional cost: £${additionalCost.toFixed(2)}`);
        throw new Error(`Price validation failed for Pizza Builder: ${userChoice.name}`);
      }
      
      console.log(`💰 Pizza Builder price calculated:`);
      console.log(`   Base price: £${basePrice.toFixed(2)}`);
      console.log(`   Additional cost: £${additionalCost.toFixed(2)}`);
      console.log(`   Per item: £${finalPricePerItem.toFixed(2)}`);
      console.log(`   Quantity: ${localItem.quantity}`);
      console.log(`   Total: £${userChoicePrice.toFixed(2)}`);
      
      return userChoicePrice;
    }
    
    // For pizza items - SECURE CALCULATION MATCHING FRONTEND
    const pizzaId = localItem.pizzaId || localItem.pizza?.id || localItem.id;
    const size = localItem.size || "Medium"; // Move size declaration to top
    
    const pizza = await prisma.pizza.findUnique({
      where: { id: pizzaId },
      include: {
        defaultToppings: {
          include: {
            topping: true
          }
        },
        defaultIngredients: {
          include: {
            ingredient: true
          }
        },
      }
    });
    
    if (!pizza) {
      throw new Error(`Pizza not found: ${pizzaId}`);
    }
    
    // 🔒 SECURE PIZZA BASE VALIDATION with dynamic pricing
    const rawPizzaBase = localItem.pizzaBase || "Regular Crust";
    const pizzaBase = normalizePizzaBase(rawPizzaBase); // Normalize frontend variations
    
    // Get base cost - handle both static and dynamic pricing
    let baseCost = 0;
    const baseHandler = VALID_PIZZA_BASES[pizzaBase];
    
    if (baseHandler === undefined) {
      console.warn(`🚨 SECURITY ALERT: Invalid pizza base attempted: "${rawPizzaBase}" (normalized: "${pizzaBase}")`);
      console.warn(`   Valid options: ${Object.keys(VALID_PIZZA_BASES).join(', ')}`);
      throw new Error(`Invalid pizza base: ${rawPizzaBase}`);
    }
    
    // Calculate base cost - if it's a function (stuffed crust), call it with size
    if (typeof baseHandler === 'function') {
      baseCost = baseHandler(size);
      console.log(`🍕 Pizza base: ${rawPizzaBase} (normalized: ${pizzaBase}), Size: ${size}, Dynamic cost: £${baseCost.toFixed(2)}`);
    } else {
      baseCost = baseHandler;
      console.log(`🍕 Pizza base: ${rawPizzaBase} (normalized: ${pizzaBase}), Static cost: £${baseCost.toFixed(2)}`);
    }
    
    // Get base price from database - START WITH MEDIUM as new base
    const sizes = typeof pizza.sizes === "string" ? JSON.parse(pizza.sizes) : pizza.sizes;
    let basePrice = Number(sizes.MEDIUM || 0); // ✅ Start with MEDIUM as new base
    
    console.log(`🍕 Starting base price (MEDIUM): £${basePrice.toFixed(2)}`);
    
    // Calculate topping costs FIRST (before size adjustments) - Match frontend logic
    let toppingCost = 0;
    const sizeMultiplier = getSizeMultiplier(size);

    const toppings = localItem.toppings || [];

    // Determine if this item is a pizza-builder style where some toppings are free
    const isPizzaBuilder = localItem.isPizzaBuilder || localItem.pizzaBuilderMode || localItem.startFromZero;
    
    // Calculate total topping units selected for logging (each quantity counts as individual units)
    const totalToppingsSelected = toppings.reduce((sum, topping) => {
      if (topping.quantity > 0) {
        if (isPizzaBuilder) {
          // For Pizza Builder: ALL toppings are considered "added" (no defaults)
          return sum + topping.quantity;
        } else {
          // For regular pizzas: subtract defaults
          const defaultTopping = pizza.defaultToppings?.find(dt => dt.toppingId === topping.id);
          const defaultQuantity = defaultTopping ? defaultTopping.quantity : 0;
          const addedQuantity = Math.max(0, topping.quantity - defaultQuantity);
          return sum + addedQuantity;
        }
      }
      return sum;
    }, 0);

    // Also log individual topping breakdown for clarity
    const toppingBreakdown = toppings
      .filter(t => t.quantity > 0)
      .map(topping => {
        if (isPizzaBuilder) {
          // Pizza Builder: all toppings are added
          return `${topping.id} (qty: ${topping.quantity}, all added)`;
        } else {
          // Regular pizza: calculate against defaults
          const defaultTopping = pizza.defaultToppings?.find(dt => dt.toppingId === topping.id);
          const defaultQuantity = defaultTopping ? defaultTopping.quantity : 0;
          const addedQuantity = Math.max(0, topping.quantity - defaultQuantity);
          return `${topping.id} (qty: ${topping.quantity}, added: ${addedQuantity})`;
        }
      });

    console.log(`🔍 Topping breakdown: [${toppingBreakdown.join(', ')}]`);
    
    let maxToppingsLimit = null;
    if (isPizzaBuilder) {
      // For Pizza Builder items, ALWAYS validate from database - NEVER trust frontend values
      let validatedMaxToppings = 4; // Default fallback
      
      if (localItem.pizzaBuilderDealId) {
        try {
          // Fetch the actual deal from database to validate maxToppings
          const deal = await prisma.pizzaBuilderDeal.findUnique({
            where: { id: localItem.pizzaBuilderDealId },
            select: { id: true, name: true, maxToppings: true, isActive: true }
          });
          
          if (deal && deal.isActive) {
            validatedMaxToppings = deal.maxToppings;
            console.log(`🍕 Validated Pizza Builder deal: ${deal.name} (maxToppings: ${deal.maxToppings})`);
          } else {
            console.warn(`🍕 Pizza Builder deal ${localItem.pizzaBuilderDealId} not found or inactive, using default maxToppings: ${validatedMaxToppings}`);
          }
        } catch (error) {
          console.error(`🍕 Error validating Pizza Builder deal: ${error.message}`);
        }
      } else {
        // 🚨 SECURITY: If no dealId, use rotation logic based on pizzaId to ensure consistency
        // DO NOT trust any maxToppings value from frontend
        try {
          const deals = await prisma.pizzaBuilderDeal.findMany({
            where: { isActive: true },
            select: { id: true, name: true, maxToppings: true }
          });
          
          if (deals && deals.length > 0) {
            // Use the same hash logic as frontend for consistency
            const pizzaHash = pizzaId ? pizzaId.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0) : 0;
            
            const dealIndex = Math.abs(pizzaHash) % deals.length;
            const selectedDeal = deals[dealIndex];
            validatedMaxToppings = selectedDeal.maxToppings;
            
            console.log(`🍕 Backend auto-selected deal: ${selectedDeal.name} (maxToppings: ${selectedDeal.maxToppings}) via rotation for pizza ${pizzaId}`);
          } else {
            console.log(`🍕 No active deals found, using default maxToppings: ${validatedMaxToppings}`);
          }
        } catch (error) {
          console.error(`🍕 Error in backend deal rotation: ${error.message}`);
          console.log(`🍕 Fallback to default maxToppings: ${validatedMaxToppings}`);
        }
      }
      
      // 🚨 SECURITY: Ignore any maxToppings from frontend - only use database validated values
      if (localItem.maxToppings && localItem.maxToppings !== validatedMaxToppings) {
        console.warn(`🚨 SECURITY: Frontend sent maxToppings: ${localItem.maxToppings}, but database says: ${validatedMaxToppings}. Using database value for security.`);
      }
      
      maxToppingsLimit = validatedMaxToppings;
      
      console.log(`🍕 Pizza Builder detected!`);
      console.log(`   📊 Total toppings selected: ${totalToppingsSelected}`);
      console.log(`   🎯 Max free toppings allowed: ${maxToppingsLimit}`);
      console.log(`   💰 Extra toppings to be charged: ${Math.max(0, totalToppingsSelected - maxToppingsLimit)}`);
    } else {
      // For regular pizzas, no free topping limit applies
      maxToppingsLimit = null;
      console.log(`🍕 Regular pizza detected - no free topping limit`);
      console.log(`   📊 Total toppings selected: ${totalToppingsSelected} (all will be charged)`);
    }

    // If maxToppingsLimit is present, consume free topping units first (sequence order)
    let freeUnitsRemaining = (maxToppingsLimit !== null) ? Number(maxToppingsLimit) : null;

    for (const topping of toppings) {
      if (topping.quantity > 0) {
        // Validate topping exists and get real price from database
        const toppingData = await prisma.toppingsList.findUnique({
          where: { id: topping.id }
        });

        if (!toppingData) {
          console.warn(`⚠️ Invalid topping ID: ${topping.id}`);
          continue; // Skip invalid toppings
        }

        // Calculate price difference from default
        let defaultQuantity, addedQuantity, removedQuantity;
        
        if (isPizzaBuilder) {
          // For Pizza Builder: treat ALL toppings as added (no defaults)
          defaultQuantity = 0;
          addedQuantity = topping.quantity;
          removedQuantity = 0;
        } else {
          // For regular pizzas: calculate against defaults
          const defaultTopping = pizza.defaultToppings?.find(dt => dt.toppingId === topping.id);
          defaultQuantity = defaultTopping ? defaultTopping.quantity : 0;
          addedQuantity = Math.max(0, topping.quantity - defaultQuantity);
          removedQuantity = Math.max(0, defaultQuantity - topping.quantity);
        }

        if (addedQuantity > 0) {
          if (freeUnitsRemaining === null) {
            // No free-topping rule applies: charge all added units
            const realToppingPrice = Number(toppingData.price) * sizeMultiplier;
            const toppingCostAdded = realToppingPrice * addedQuantity;
            toppingCost += toppingCostAdded;
            console.log(`🧄 Topping Added (no free limit): ${toppingData.name}, Added: ${addedQuantity}, Unit: £${toppingData.price}, Multiplier: ${sizeMultiplier}x, Total: £${toppingCostAdded.toFixed(2)}`);
          } else {
            // Consume free units first, then charge for remaining added units
            let unitsToCharge = 0;
            if (freeUnitsRemaining > 0) {
              const consume = Math.min(freeUnitsRemaining, addedQuantity);
              freeUnitsRemaining -= consume;
              unitsToCharge = addedQuantity - consume;
            } else {
              unitsToCharge = addedQuantity;
            }

            if (unitsToCharge > 0) {
              const realToppingPrice = Number(toppingData.price) * sizeMultiplier;
              const toppingCostAdded = realToppingPrice * unitsToCharge;
              toppingCost += toppingCostAdded;
              console.log(`🧄 Topping Added (builder): ${toppingData.name}, Added: ${addedQuantity}, Charged Units: ${unitsToCharge}, Unit: £${toppingData.price}, Multiplier: ${sizeMultiplier}x, Charge: £${toppingCostAdded.toFixed(2)}`);
            } else {
              console.log(`🧄 Topping Added (builder): ${toppingData.name}, Added: ${addedQuantity}, Charged Units: 0 (covered by free limit), Free remaining: ${freeUnitsRemaining}`);
            }
          }
        }

        if (removedQuantity > 0) {
          // Removed toppings reduce cost with size multiplier
          const realToppingPrice = Number(toppingData.price) * sizeMultiplier;
          const toppingCostRemoved = realToppingPrice * removedQuantity;
          toppingCost -= toppingCostRemoved;

          console.log(`🧄 Topping Removed: ${toppingData.name}, Removed: ${removedQuantity}, Base Price: £${toppingData.price}, Multiplier: ${sizeMultiplier}x, Total: -£${toppingCostRemoved.toFixed(2)}`);
        }
      }
    }
    
    // Calculate ingredient costs - NO SIZE MULTIPLIER FOR INGREDIENTS
    let ingredientCost = 0;
    const ingredients = localItem.ingredients || [];
    
    for (const ingredient of ingredients) {
      if (ingredient.quantity > 0) {
        // Validate ingredient exists and get real price from database
        const ingredientData = await prisma.ingredientsList.findUnique({
          where: { id: ingredient.id }
        });
        
        if (!ingredientData) {
          console.warn(`⚠️ Invalid ingredient ID: ${ingredient.id}`);
          continue; // Skip invalid ingredients
        }
        
        // Calculate price difference from default
        const defaultIngredient = pizza.defaultIngredients?.find(di => di.ingredientId === ingredient.id);
        const defaultQuantity = defaultIngredient ? defaultIngredient.quantity : 0;
        const addedQuantity = Math.max(0, ingredient.quantity - defaultQuantity);
        const removedQuantity = Math.max(0, defaultQuantity - ingredient.quantity);
        
        if (addedQuantity > 0) {
          const realIngredientPrice = Number(ingredientData.price);
          const ingredientCostAdded = realIngredientPrice * addedQuantity;
          ingredientCost += ingredientCostAdded;
          
          console.log(`🥬 Ingredient Added: ${ingredientData.name}, Added: ${addedQuantity}, Price: £${realIngredientPrice.toFixed(2)} (NO multiplier), Total: £${ingredientCostAdded.toFixed(2)}`);
        }
        
        if (removedQuantity > 0) {
          const realIngredientPrice = Number(ingredientData.price);
          const ingredientCostRemoved = realIngredientPrice * removedQuantity;
          ingredientCost -= ingredientCostRemoved;
          
          console.log(`🥬 Ingredient Removed: ${ingredientData.name}, Removed: ${removedQuantity}, Price: £${realIngredientPrice.toFixed(2)} (NO multiplier), Total: -£${ingredientCostRemoved.toFixed(2)}`);
        }
      }
    }
    
    // Now calculate the temp price (like frontend finalPrice)
    let tempPrice = basePrice + toppingCost + ingredientCost;
    
    // Ensure minimum price is the base price (like frontend Math.max logic)
    let finalPricePerItem = Math.max(tempPrice, basePrice);
    
    console.log(`🍕 After toppings/ingredients - tempPrice: £${tempPrice.toFixed(2)}, finalPricePerItem: £${finalPricePerItem.toFixed(2)}`);
    
    // NOW apply size adjustments like frontend - MATCH EXACT FRONTEND LOGIC
    switch (size) {
      case "Large":
        // Use the actual LARGE price plus toppings/ingredients
        const largePizzaBasePrice = Number(sizes.LARGE || 0);
        finalPricePerItem = largePizzaBasePrice + toppingCost + ingredientCost;
        console.log(`🍕 Large size base: £${largePizzaBasePrice.toFixed(2)}, total: £${finalPricePerItem.toFixed(2)}`);
        break;
      case "Super Size":
        // Use the actual SUPER_SIZE price plus toppings/ingredients
        const superSizePizzaBasePrice = Number(sizes.SUPER_SIZE || 0);
        finalPricePerItem = superSizePizzaBasePrice + toppingCost + ingredientCost;
        console.log(`🍕 Super Size base: £${superSizePizzaBasePrice.toFixed(2)}, total: £${finalPricePerItem.toFixed(2)}`);
        break;
      case "Medium":
      default:
        // Medium uses the already calculated price (base + toppings + ingredients)
        console.log(`🍕 Medium size - using calculated price: £${finalPricePerItem.toFixed(2)}`);
        break;
    }
    
    // Add pizza base cost with dynamic pricing
    if (pizzaBase === "Stuffed Crust +2£") {
      // Dynamic stuffed crust pricing based on size (already calculated above)
      finalPricePerItem += baseCost;
      console.log(`🍕 Stuffed crust adjustment (${size}): +£${baseCost.toFixed(2)}`);
    } else if (baseCost > 0) {
      // Static pricing for other bases
      finalPricePerItem += baseCost;
      console.log(`🍕 ${rawPizzaBase} adjustment: +£${baseCost.toFixed(2)}`);
    }
    
    // Final price with quantity
    const finalPrice = finalPricePerItem * localItem.quantity;
    
    console.log(`🔒 SECURE CALCULATION COMPLETE (MATCHING FRONTEND):`);
    console.log(`   Starting Base (MEDIUM): £${basePrice.toFixed(2)}`);
    console.log(`   Toppings: £${toppingCost.toFixed(2)} (WITH ${sizeMultiplier}x multiplier for ${size})`);
    console.log(`   Ingredients: £${ingredientCost.toFixed(2)} (NO multiplier)`);
    console.log(`   After adjustments: £${tempPrice.toFixed(2)}`);
    console.log(`   Minimum enforced: £${Math.max(tempPrice, basePrice).toFixed(2)}`);
    console.log(`   Size adjustment: ${size}`);
    console.log(`   Pizza Base: ${rawPizzaBase} (normalized: ${pizzaBase}) (+£${baseCost.toFixed(2)})`);
    console.log(`   Per Item Final: £${finalPricePerItem.toFixed(2)}`);
    console.log(`   Quantity: ${localItem.quantity}`);
    console.log(`   FINAL TOTAL: £${finalPrice.toFixed(2)}`);
    
    // Compare with frontend price for security logging
    const frontendPrice = Number(localItem.price || 0);
    if (Math.abs(frontendPrice - finalPrice) > 0.01) {
      console.warn(`🚨 SECURITY ALERT: Price mismatch detected!`);
      console.warn(`   Frontend claimed: £${frontendPrice.toFixed(2)}`);
      console.warn(`   Backend calculated: £${finalPrice.toFixed(2)}`);
      console.warn(`   Difference: £${(frontendPrice - finalPrice).toFixed(2)}`);
    } else {
      console.log(`✅ Price validation passed - Frontend and backend prices match!`);
    }
    
    return finalPrice;
    
  } catch (error) {
    console.error("🚨 Error in secure price calculation:", error);
    throw new Error(`Failed to calculate secure price: ${error.message}`);
  }
}

export default async function syncCart(req, res) {
  console.log("🔥 SECURE Cart Sync Started");

  try {
    // Authenticate user manually
    await new Promise((resolve, reject) => {
      authenticateUser(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const userId = req.user.id;
    const localItems = req.body.cartItems || [];

    // Debug: Log received items for Pizza Builder debugging
    console.log("📦 DEBUG: Received items breakdown:");
    localItems.forEach((item, index) => {
      console.log(`   ${index + 1}. Type: ${item.type || 'pizza'}, ID: ${item.id}, Title: ${item.title || item.name}`);
      
      // Enhanced Pizza Builder detection
      if (item.type === 'userChoice' || item.isPizzaBuilder || item.pizzaBuilderDealId) {
        console.log(`      - Pizza Builder item detected`);
        console.log(`      - Pizza Builder Deal ID: ${item.pizzaBuilderDealId || item.id}`);
        console.log(`      - Size: ${item.size || 'Medium'}`);
        console.log(`      - Max toppings: ${item.maxToppings || 'Not specified'}`);
        
        if (item.selectedItems?.toppings) {
          console.log(`      - Selected toppings: ${item.selectedItems.toppings.length}`);
        }
        if (item.toppings) {
          console.log(`      - Toppings array: ${item.toppings.length}`);
        }
      }
    });

    console.log("📦 Received items for secure processing:", localItems.length);
    console.log("👤 User ID:", userId);

    // SECURITY: Validate and recalculate all prices
    console.log("🔒 Starting secure price validation...");
    
    const validatedItems = [];
    for (const localItem of localItems) {
      try {
        const securePrice = await calculateSecurePrice(localItem);
        const eachPrice = securePrice / localItem.quantity;
        
        // Enhanced Pizza Builder detection for proper validation
        const isPizzaBuilder = localItem.isPizzaBuilder || 
                              localItem.type === 'pizzaBuilder' || 
                              localItem.pizzaBuilderDealId ||
                              (localItem.type === 'userChoice' && localItem.selectedItems?.toppings);
        
        validatedItems.push({
          ...localItem,
          securePrice: securePrice,
          secureEachPrice: eachPrice,
          validated: true,
          isPizzaBuilder: isPizzaBuilder, // Ensure this flag is set correctly
          // Store cleaned toppings for Pizza Builder items
          cleanedToppings: isPizzaBuilder ? (localItem.cleanedToppings || localItem.toppings) : undefined,
        });
        
        console.log(`✅ Validated item: ${localItem.title}, Size: ${localItem.size}, Quantity: ${localItem.quantity}, Secure Price: £${securePrice.toFixed(2)}, Pizza Builder: ${isPizzaBuilder}`);
        
      } catch (error) {
        console.error(`❌ Failed to validate item: ${localItem.title}`, error.message);
        // Skip invalid items for security
        continue;
      }
    }
    
    console.log(`🔒 Validated ${validatedItems.length} out of ${localItems.length} items`);

    // Find existing cart or create new one
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        cartItems: {
          include: {
            pizza: true,
            combo: true,
            otherItem: true,
            cartToppings: true,
            cartIngredients: true,
          },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          cartItems: {
            include: {
              pizza: true,
              combo: true,
              otherItem: true,
              cartToppings: true,
              cartIngredients: true,
            },
          },
        },
      });
    }

    // **NEW: Validate existing Pizza Builder items in cart**
    console.log('🔍 Validating existing Pizza Builder items in cart...');
    if (cart.cartItems && cart.cartItems.length > 0) {
      const pizzaBuilderItems = cart.cartItems.filter(item => item.pizzaBuilderDealId);
      console.log(`📊 Found ${pizzaBuilderItems.length} existing Pizza Builder items in cart`);
      
      for (const pbItem of pizzaBuilderItems) {
        console.log('=== EXISTING PIZZA BUILDER VALIDATION ===');
        console.log(`🔍 Validating existing Pizza Builder item:`, {
          id: pbItem.id,
          pizzaBuilderDealId: pbItem.pizzaBuilderDealId,
          selectedToppings: pbItem.selectedToppings,
          size: pbItem.size,
          quantity: pbItem.quantity
        });
        
        // Fetch the Pizza Builder deal to validate
        const deal = await prisma.pizzaBuilderDeal.findUnique({
          where: { id: pbItem.pizzaBuilderDealId }
        });
        
        if (!deal) {
          console.log(`❌ Pizza Builder deal not found for item ${pbItem.id}, will be removed`);
          continue;
        }
        
        console.log(`✅ Found deal: ${deal.name}`, {
          availableToppings: deal.availableToppings,
          toppingsData: deal.toppingsData,
          maxToppings: deal.maxToppings
        });
        
        // Parse and validate existing selectedToppings
        let existingToppings = [];
        try {
          if (typeof pbItem.selectedToppings === 'string') {
            const parsed = JSON.parse(pbItem.selectedToppings);
            if (Array.isArray(parsed)) {
              existingToppings = parsed;
              console.log(`📋 Existing toppings (array format):`, existingToppings);
            } else if (typeof parsed === 'object') {
              // Convert {id: name} to array format
              existingToppings = Object.entries(parsed).map(([id, name]) => ({
                id: id,
                name: name,
                quantity: 1
              }));
              console.log(`📋 Existing toppings (object format converted):`, existingToppings);
            }
          } else if (Array.isArray(pbItem.selectedToppings)) {
            existingToppings = pbItem.selectedToppings;
            console.log(`📋 Existing toppings (direct array):`, existingToppings);
          }
        } catch (error) {
          console.log(`❌ Error parsing existing toppings for item ${pbItem.id}:`, error);
          existingToppings = [];
        }
        
        console.log('=== END EXISTING PIZZA BUILDER VALIDATION ===');
      }
    } else {
      console.log('📝 No existing cart items to validate');
    }

    // Batch process VALIDATED items only
    const itemsToUpdate = [];
    const itemsToCreate = [];

    for (const validatedItem of validatedItems) {
      // Better handling of different item types
      let pizzaId = null;
      if (!validatedItem.isCombo && !validatedItem.isOtherItem && !validatedItem.comboStyleItemId && !validatedItem.isPizzaBuilder) {
        pizzaId = validatedItem.pizzaId || validatedItem.pizza?.id || validatedItem.id;
        if (!pizzaId) {
          console.warn("⚠️ Skipping pizza item with missing pizzaId:", validatedItem);
          continue;
        }
      }

      const toppings =
        validatedItem.toppings ||
        validatedItem.cartToppings?.map((t) => ({
          id: t.toppingId,
          quantity: t.addedQuantity,
        })) ||
        [];

      const ingredients =
        validatedItem.ingredients ||
        validatedItem.cartIngredients?.map((i) => ({
          id: i.ingredientId,
          quantity: i.addedQuantity,
        })) ||
        [];

      // Find existing item with enhanced matching logic
      const existing = cart.cartItems.find((item) => {
        const itemWithToppingsAndIngredients = {
          ...item,
          toppings: item.cartToppings?.map((t) => ({
            id: t.toppingId,
            quantity: t.addedQuantity,
          })) || [],
          ingredients: item.cartIngredients?.map((i) => ({
            id: i.ingredientId,
            quantity: i.addedQuantity,
          })) || [],
        };
        
        const matches = itemsMatch(itemWithToppingsAndIngredients, validatedItem);
        if (matches) {
          console.log(`🔄 MERGE: Found matching existing item for ${validatedItem.title || validatedItem.name}`);
        }
        return matches;
      });

      // **NEW: Also check for duplicates within the current batch**
      const duplicateInBatch = itemsToCreate.find((createItem) => {
        // Check if this is the same Pizza Builder item already being created
        if (validatedItem.isPizzaBuilder && createItem.pizzaBuilderDealId) {
          const isSameDeal = createItem.pizzaBuilderDealId === (validatedItem.pizzaBuilderDealId || validatedItem.id);
          const isSameSize = createItem.size === validatedItem.size;
          const isSameBase = createItem.pizzaBase === (validatedItem.pizzaBase || validatedItem.selectedItems?.base || "Regular Crust");
          
          if (isSameDeal && isSameSize && isSameBase) {
            console.log(`🔄 BATCH DUPLICATE: Found duplicate Pizza Builder in current batch - ${validatedItem.title || validatedItem.name}`);
            return true;
          }
        }
        return false;
      });

      // USE ONLY SECURE PRICES - NEVER TRUST FRONTEND
      const securePrice = validatedItem.securePrice;
      const secureEachPrice = validatedItem.secureEachPrice;

      if (existing) {
        // Update existing item quantities with SECURE PRICE
        console.log(`📝 UPDATING existing cart item: ${validatedItem.title || validatedItem.name}`);
        itemsToUpdate.push({
          id: existing.id,
          quantity: existing.quantity + validatedItem.quantity,
          finalPrice: Number(existing.finalPrice) + Number(securePrice),
        });
      } else if (duplicateInBatch) {
        // Merge with existing item in batch
        console.log(`📝 MERGING with batch item: ${validatedItem.title || validatedItem.name}`);
        duplicateInBatch.quantity += validatedItem.quantity;
        duplicateInBatch.finalPrice = Number(duplicateInBatch.finalPrice) + Number(securePrice);
      } else {
        // Create new item with SECURE PRICE
        console.log(`🆕 CREATING new cart item: ${validatedItem.title || validatedItem.name}`);
        if (validatedItem.isPizzaBuilder) {
          // **ENHANCED: Handle Pizza Builder items**
          console.log('=== PIZZA BUILDER CART MERGE DEBUG ===');
          console.log(`🍕 Creating Pizza Builder cart item: ${validatedItem.title || validatedItem.name}`);
          
          // Get the correct Pizza Builder deal ID
          const pizzaBuilderDealId = validatedItem.pizzaBuilderDealId || validatedItem.id;
          console.log(`🆔 Pizza Builder Deal ID: ${pizzaBuilderDealId}`);
          
          // **NEW: Format selected toppings as {id:name, id:name}**
          const receivedToppings = validatedItem.cleanedToppings || validatedItem.toppings || validatedItem.selectedItems?.toppings || [];
          
          // **FIXED: Only process actually selected toppings (quantity > 0)**
          const actuallySelectedToppings = receivedToppings.filter(topping => 
            topping.quantity && topping.quantity > 0
          );
          
          console.log(`🧄 Received ${receivedToppings.length} toppings, ${actuallySelectedToppings.length} actually selected`);
          console.log(`🧄 Selected toppings:`, actuallySelectedToppings.map(t => `${t.name}(${t.quantity})`).join(', '));
          
          const toppingsObject = {};
          
          actuallySelectedToppings.forEach(topping => {
            if (topping.quantity > 0) {
              // Store in format {id: name} for each selected topping
              toppingsObject[topping.id] = topping.name;
              console.log(`   ✅ Added topping: ${topping.id} -> ${topping.name} (qty: ${topping.quantity})`);
            } else {
              console.log(`   ❌ Skipped topping: ${topping.name} (qty: ${topping.quantity})`);
            }
          });
          
          const toppingsString = JSON.stringify(toppingsObject);
          console.log(`🧄 Final Pizza Builder toppings format: ${toppingsString}`);
          console.log(`📏 Size: ${validatedItem.size || "Medium"}`);
          console.log(`🍞 Base: ${validatedItem.pizzaBase || validatedItem.selectedItems?.base || "Regular Crust"}`);
          console.log(`💰 Secure Price: £${securePrice.toFixed(2)} (each: £${secureEachPrice.toFixed(2)})`);
          console.log(`📦 Quantity: ${validatedItem.quantity}`);
          
          const cartItemData = {
            cartId: cart.id,
            pizzaId: null, // Pizza Builder is not a regular pizza
            comboId: null,
            otherItemId: null,
            comboStyleItemId: null,
            pizzaBuilderDealId: pizzaBuilderDealId, // Store the Pizza Builder deal ID
            size: validatedItem.size || "Medium",
            quantity: validatedItem.quantity,
            basePrice: secureEachPrice,
            finalPrice: securePrice,
            pizzaBase: validatedItem.pizzaBase || validatedItem.selectedItems?.base || "Regular Crust",
            // **REMOVED: sauce field (not needed)**
            // sauce: validatedItem.sauce || validatedItem.selectedItems?.sauce || "Tomato Sauce",
            isCombo: false,
            isOtherItem: false,
            maxToppings: validatedItem.maxToppings || 4,
            // **NEW: Store toppings as formatted string {id:name, id:name}**
            selectedToppings: toppingsString,
            toppings: [], // Keep empty for Pizza Builder (use selectedToppings instead)
            ingredients: [], // Pizza Builder doesn't use ingredients
          };
          
          console.log(`📄 Cart item data to be created:`, cartItemData);
          itemsToCreate.push(cartItemData);
          console.log('=== END PIZZA BUILDER CART MERGE DEBUG ===');
        } else if (validatedItem.comboStyleItemId) {
          // Handle combo style items
          itemsToCreate.push({
            cartId: cart.id,
            comboStyleItemId: validatedItem.comboStyleItemId,
            pizzaId: null,
            comboId: null,
            otherItemId: null,
            size: validatedItem.size,
            quantity: validatedItem.quantity,
            basePrice: secureEachPrice,
            finalPrice: securePrice,
            pizzaBase: null,
            isCombo: false,
            isOtherItem: false,
            isMealDeal: validatedItem.isMealDeal || false,
            selectedSides: validatedItem.selectedSides || null,
            selectedDrinks: validatedItem.selectedDrinks || null,
            sauce: validatedItem.sauce || null,
            toppings: [],
            ingredients: [],
          });
        } else if (validatedItem.type === 'userChoice') {
          // **NEW: Handle user choice items (including Pizza Builder)**
          const userChoiceSelections = validatedItem.selectedItems || {};
          
          // Calculate additional costs for Pizza Builder
          let additionalToppingCost = 0;
          if (userChoiceSelections.toppings && Array.isArray(userChoiceSelections.toppings)) {
            const maxToppings = validatedItem.maxToppings || 4;
            const extraToppings = Math.max(0, userChoiceSelections.toppings.length - maxToppings);
            
            if (extraToppings > 0) {
              // Calculate the extra topping cost (already calculated in validation)
              const totalPrice = securePrice;
              const basePrice = secureEachPrice * validatedItem.quantity;
              additionalToppingCost = totalPrice - basePrice;
              
              console.log(`🍕 Pizza Builder cart item: ${extraToppings} extra toppings, additional cost: £${additionalToppingCost.toFixed(2)}`);
            }
          }
          
          itemsToCreate.push({
            cartId: cart.id,
            pizzaId: null,
            comboId: null,
            otherItemId: null,
            comboStyleItemId: null,
            userChoiceId: validatedItem.id,
            userChoiceSelections: JSON.stringify(userChoiceSelections),
            size: validatedItem.size || 'Regular',
            quantity: validatedItem.quantity,
            basePrice: secureEachPrice,
            finalPrice: securePrice,
            additionalToppingCost: additionalToppingCost, // Store extra topping cost
            maxToppings: validatedItem.maxToppings || 4, // Store max toppings for reference
            pizzaBase: null,
            isCombo: false,
            isOtherItem: false,
            isMealDeal: false,
            selectedSides: null,
            selectedDrinks: null,
            sauce: null,
            toppings: [],
            ingredients: [],
          });
        } else if (validatedItem.isCombo) {
          itemsToCreate.push({
            cartId: cart.id,
            comboId: validatedItem.id,
            pizzaId: null,
            otherItemId: null,
            comboStyleItemId: null,
            size: "COMBO",
            quantity: validatedItem.quantity,
            basePrice: secureEachPrice,
            finalPrice: securePrice,
            pizzaBase: null,
            isCombo: true,
            isOtherItem: false,
            toppings: [],
            ingredients: [],
          });
        } else if (validatedItem.isOtherItem) {
          itemsToCreate.push({
            cartId: cart.id,
            otherItemId: validatedItem.id,
            pizzaId: null,
            comboId: null,
            comboStyleItemId: null,
            size: "OTHER",
            quantity: validatedItem.quantity,
            basePrice: secureEachPrice,
            finalPrice: securePrice,
            pizzaBase: null,
            sauce: validatedItem.sauce || null, // Add sauce support
            isCombo: false,
            isOtherItem: true,
            toppings: [],
            ingredients: [],
          });
        } else {
          itemsToCreate.push({
            cartId: cart.id,
            pizzaId: pizzaId,
            comboId: null,
            otherItemId: null,
            comboStyleItemId: null,
            size: validatedItem.size,
            quantity: validatedItem.quantity,
            basePrice: secureEachPrice,
            finalPrice: securePrice, // SECURE PRICE ONLY
            pizzaBase: normalizePizzaBase(validatedItem.pizzaBase) || "Regular Crust",
            isCombo: false,
            isOtherItem: false,
            toppings: toppings,
            ingredients: ingredients,
          });
        }
      }
    }

    // Execute all operations in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Batch update existing items
      const updatePromises = itemsToUpdate.map(item =>
        tx.cartItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity,
            finalPrice: item.finalPrice,
          },
        })
      );

      // Batch create new items
      const createPromises = itemsToCreate.map(item => {
        if (item.toppings.length > 0 || item.ingredients.length > 0 || item.pizzaBuilderDealId) {
          // Create pizza items with toppings/ingredients OR Pizza Builder items
          return tx.cartItem.create({
            data: {
              cartId: item.cartId,
              pizzaId: item.pizzaId,
              comboId: item.comboId,
              otherItemId: item.otherItemId,
              comboStyleItemId: item.comboStyleItemId, // Add combo style item support
              pizzaBuilderDealId: item.pizzaBuilderDealId, // Add Pizza Builder support
              size: item.size,
              quantity: item.quantity,
              basePrice: item.basePrice,
              finalPrice: item.finalPrice, // SECURE PRICE
              pizzaBase: item.pizzaBase,
              isCombo: item.isCombo,
              isOtherItem: item.isOtherItem,
              isMealDeal: item.isMealDeal, // Add meal deal flag
              selectedSides: item.selectedSides, // Add sides selection
              selectedDrinks: item.selectedDrinks, // Add drinks selection
              sauce: item.sauce, // Add sauce selection
              maxToppings: item.maxToppings, // Add max toppings for Pizza Builder
              selectedToppings: item.selectedToppings, // Add selected toppings for Pizza Builder
              cartToppings: {
                create: item.toppings.map((t) => ({
                  toppingId: t.id,
                  defaultQuantity: 0,
                  addedQuantity: t.quantity,
                })),
              },
              cartIngredients: {
                create: item.ingredients.map((i) => ({
                  ingredientId: i.id,
                  defaultQuantity: 0,
                  addedQuantity: i.quantity,
                })),
              },
            },
            include: {
              cartToppings: true,
              cartIngredients: true,
            },
          });
        } else {
          // Create simple items
          return tx.cartItem.create({
            data: {
              cartId: item.cartId,
              pizzaId: item.pizzaId,
              comboId: item.comboId,
              otherItemId: item.otherItemId,
              comboStyleItemId: item.comboStyleItemId, // Add combo style item support
              pizzaBuilderDealId: item.pizzaBuilderDealId, // Add Pizza Builder support
              // **NEW: Add user choice item support with Pizza Builder fields**
              userChoiceId: item.userChoiceId,
              userChoiceSelections: item.userChoiceSelections,
              additionalToppingCost: item.additionalToppingCost || 0,
              maxToppings: item.maxToppings || 4,
              selectedToppings: item.selectedToppings, // Add selected toppings for Pizza Builder
              size: item.size,
              quantity: item.quantity,
              basePrice: item.basePrice,
              finalPrice: item.finalPrice, // SECURE PRICE
              pizzaBase: item.pizzaBase,
              isCombo: item.isCombo,
              isOtherItem: item.isOtherItem,
              isMealDeal: item.isMealDeal, // Add meal deal flag
              selectedSides: item.selectedSides, // Add sides selection
              selectedDrinks: item.selectedDrinks, // Add drinks selection
              sauce: item.sauce, // Add sauce selection
            },
          });
        }
      });

      // Execute all updates and creates in parallel
      const [updatedItems, createdItems] = await Promise.all([
        Promise.all(updatePromises),
        Promise.all(createPromises),
      ]);

      // Calculate totals
      const [totalPrice, totalQuantity] = await Promise.all([
        tx.cartItem.aggregate({
          where: { cartId: cart.id },
          _sum: { finalPrice: true },
        }),
        tx.cartItem.aggregate({
          where: { cartId: cart.id },
          _sum: { quantity: true },
        }),
      ]);

      // Update cart total
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          totalAmount: totalPrice._sum.finalPrice || 0,
        },
      });

      return {
        updatedItems,
        createdItems,
        totalPrice: totalPrice._sum.finalPrice || 0,
        totalQuantity: totalQuantity._sum.quantity || 0,
      };
    }, {
      timeout: 15000,
    });

    console.log("✅ SECURE Cart Items processed:", `Updated: ${result.updatedItems.length}, Created: ${result.createdItems.length}`);
    console.log("💰 SECURE Cart Final Total: £", Number(result.totalPrice).toFixed(2));

    const allItems = [...result.updatedItems, ...result.createdItems];

    res.json({
      items: allItems,
      totalQuantity: result.totalQuantity,
      totalPrice: result.totalPrice,
      security: {
        validated: true,
        itemsProcessed: validatedItems.length,
        itemsRejected: localItems.length - validatedItems.length
      }
    });

  } catch (err) {
    console.error("🚨 SECURITY ERROR in syncCart:", err);
    
    // Handle Prisma connection errors
    if (err.constructor.name === 'PrismaClientInitializationError' || 
        err.message.includes("Can't reach database server")) {
      console.error("❌ Database connection failed:", err.message);
      return res.status(503).json({ 
        error: "Database temporarily unavailable. Please try again in a moment.",
        type: "DATABASE_CONNECTION_ERROR"
      });
    }
    
    // Handle Prisma validation errors (missing fields)
    if (err.code === 'P2002' || err.code === 'P2025' || 
        err.message.includes("Unknown field")) {
      console.error("❌ Database schema mismatch:", err.message);
      return res.status(500).json({ 
        error: "Database schema needs to be updated. Please run migrations.",
        type: "SCHEMA_ERROR"
      });
    }
    
    if (err.code === 'P2024') {
      return res.status(408).json({ 
        error: "Request timeout. Please try again with fewer items.",
        type: "TIMEOUT_ERROR"
      });
    }
    
    // Handle Pizza Builder validation errors
    if (err.message.includes("Pizza Builder") || err.message.includes("Invalid topping")) {
      return res.status(400).json({ 
        error: err.message,
        type: "PIZZA_BUILDER_VALIDATION_ERROR"
      });
    }
    
    res.status(500).json({ 
      error: "Internal server error during secure cart sync.",
      type: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

