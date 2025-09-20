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

// Enhanced item matching logic that considers pizzaBase
function itemsMatch(existingItem, localItem) {
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
    !existingItem.comboStyleItemId
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
    console.log("🔍 DEBUG - localItem structure:", {
      comboStyleItemId: localItem.comboStyleItemId,
      isCombo: localItem.isCombo,
      isOtherItem: localItem.isOtherItem,
      id: localItem.id,
      pizzaId: localItem.pizzaId
    });
    
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
        const defaultTopping = pizza.defaultToppings?.find(dt => dt.toppingId === topping.id);
        const defaultQuantity = defaultTopping ? defaultTopping.quantity : 0;
        const addedQuantity = Math.max(0, topping.quantity - defaultQuantity);
        const removedQuantity = Math.max(0, defaultQuantity - topping.quantity);
        
        if (addedQuantity > 0) {
          // Added toppings cost extra with size multiplier
          const realToppingPrice = Number(toppingData.price) * sizeMultiplier;
          const toppingCostAdded = realToppingPrice * addedQuantity;
          toppingCost += toppingCostAdded;
          
          console.log(`🧄 Topping Added: ${toppingData.name}, Added: ${addedQuantity}, Base Price: £${toppingData.price}, Multiplier: ${sizeMultiplier}x, Adjusted: £${realToppingPrice.toFixed(2)}, Total: £${toppingCostAdded.toFixed(2)}`);
        }
        
        if (removedQuantity > 0) {
          // Removed toppings reduce cost with size multiplier
          const realToppingPrice = Number(toppingData.price) * sizeMultiplier;
          const toppingCostRemoved = realToppingPrice * removedQuantity;
          toppingCost -= toppingCostRemoved;
          
          console.log(`🧄 Topping Removed: ${toppingData.name}, Removed: ${removedQuantity}, Base Price: £${toppingData.price}, Multiplier: ${sizeMultiplier}x, Adjusted: £${realToppingPrice.toFixed(2)}, Total: -£${toppingCostRemoved.toFixed(2)}`);
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

    console.log("📦 Received items for secure processing:", localItems.length);
    console.log("👤 User ID:", userId);

    // SECURITY: Validate and recalculate all prices
    console.log("🔒 Starting secure price validation...");
    
    const validatedItems = [];
    for (const localItem of localItems) {
      try {
        const securePrice = await calculateSecurePrice(localItem);
        const eachPrice = securePrice / localItem.quantity;
        
        validatedItems.push({
          ...localItem,
          securePrice: securePrice,
          secureEachPrice: eachPrice,
          validated: true
        });
        
        console.log(`✅ Validated item: ${localItem.title}, Size: ${localItem.size}, Quantity: ${localItem.quantity}, Secure Price: £${securePrice.toFixed(2)}`);
        
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

    // Batch process VALIDATED items only
    const itemsToUpdate = [];
    const itemsToCreate = [];

    for (const validatedItem of validatedItems) {
      // Better handling of different item types
      let pizzaId = null;
      if (!validatedItem.isCombo && !validatedItem.isOtherItem && !validatedItem.comboStyleItemId) {
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
        
        return itemsMatch(itemWithToppingsAndIngredients, validatedItem);
      });

      // USE ONLY SECURE PRICES - NEVER TRUST FRONTEND
      const securePrice = validatedItem.securePrice;
      const secureEachPrice = validatedItem.secureEachPrice;

      if (existing) {
        // Update existing item quantities with SECURE PRICE
        itemsToUpdate.push({
          id: existing.id,
          quantity: existing.quantity + validatedItem.quantity,
          finalPrice: Number(existing.finalPrice) + Number(securePrice),
        });
      } else {
        // Create new item with SECURE PRICE
        if (validatedItem.comboStyleItemId) {
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
        if (item.toppings.length > 0 || item.ingredients.length > 0) {
          // Create pizza items with toppings/ingredients
          return tx.cartItem.create({
            data: {
              cartId: item.cartId,
              pizzaId: item.pizzaId,
              comboId: item.comboId,
              otherItemId: item.otherItemId,
              comboStyleItemId: item.comboStyleItemId, // Add combo style item support
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
    
    if (err.message.includes("Can't reach database server")) {
      return res.status(503).json({ 
        error: "Database temporarily unavailable. Please try again in a moment." 
      });
    }
    
    if (err.code === 'P2024') {
      return res.status(408).json({ 
        error: "Request timeout. Please try again with fewer items." 
      });
    }
    
    res.status(500).json({ 
      error: "Internal server error during secure cart sync.",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}