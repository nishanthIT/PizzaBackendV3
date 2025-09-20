// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// /**
//  * Middleware to validate and recalculate cart prices before syncing
//  * This ensures that all prices are calculated server-side for security
//  * and prevents price manipulation from the client
//  */
// export const validateCartPrices = async (req, res, next) => {
//   console.log("Validating cart prices...");

//   try {
//     const localItems = req.body.cartItems || [];
//     if (!localItems.length) {
//       return next(); // No items to validate
//     }

//     // Create a validated copy of the cart items
//     const validatedItems = [];

//     for (const item of localItems) {
//       if (item.isCombo) {
//         // For combos, verify the price from database
//         const combo = await prisma.comboOffers.findUnique({
//           where: { id: item.id },
//         });

//         if (!combo) {
//           console.warn(`Combo with ID ${item.id} not found`);
//           continue;
//         }

//         validatedItems.push({
//           ...item,
//           price: Number(combo.price),
//           finalPrice: Number(combo.price) * item.quantity,
//           eachprice: Number(combo.price),
//         });
//       } else if (item.isOtherItem) {
//         // For other items, verify the price from database
//         const otherItem = await prisma.otherItem.findUnique({
//           where: { id: item.id },
//         });

//         if (!otherItem) {
//           console.warn(`OtherItem with ID ${item.id} not found`);
//           continue;
//         }

//         validatedItems.push({
//           ...item,
//           price: Number(otherItem.price),
//           finalPrice: Number(otherItem.price) * item.quantity,
//           eachprice: Number(otherItem.price),
//           isOtherItem: true,
//         });
//       } else {
//         // Extract the item details
//         const pizzaId = item.pizzaId || item.pizza?.id || item.id;
//         const size = item.size || "Medium";
//         const quantity = parseInt(item.quantity, 10) || 1;

//         if (!pizzaId) {
//           console.warn("Skipping item with missing pizzaId:", item);
//           continue;
//         }

//         // Fetch the pizza from the database with relations
//         const pizza = await prisma.pizza.findUnique({
//           where: { id: pizzaId },
//           include: {
//             defaultIngredients: {
//               include: {
//                 ingredient: true, // Include actual ingredient data from IngredientsList
//               },
//             },
//             defaultToppings: {
//               include: {
//                 topping: true, // Include actual topping data from ToppingsList
//               },
//             },
//           },
//         });

//         if (!pizza) {
//           console.warn(`Pizza with ID ${pizzaId} not found`);
//           continue;
//         }

//         // Parse pizza sizes
//         const sizes =
//           typeof pizza.sizes === "string"
//             ? JSON.parse(pizza.sizes)
//             : pizza.sizes;

//         // Get base price for the selected size - standardize size names for comparison
//         const sizeUpper = size.toUpperCase();
//         let basePrice = parseFloat(sizes.MEDIUM || 0);
//         if (sizeUpper === "MEDIUM" && sizes.MEDIUM) {
//           basePrice = parseFloat(sizes.MEDIUM);
//         } else if (sizeUpper === "LARGE" && sizes.LARGE) {
//           basePrice = parseFloat(sizes.LARGE);
//         } else if (sizeUpper === "SUPER_SIZE" && sizes.SUPER_SIZE) {
//           basePrice = parseFloat(sizes.SUPER_SIZE);
//         }

//         // Process ingredients
//         const ingredients = item.ingredients || [];
//         let ingredientsTotalPrice = 0;

//         // Fetch all ingredients directly from the database to get latest prices
//         const ingredientIds = ingredients.map((ing) => ing.id);
//         const dbIngredients = await prisma.ingredientsList.findMany({
//           where: {
//             id: { in: ingredientIds },
//             status: true, // Only include active ingredients
//           },
//         });

//         // Map of ingredient IDs to their latest prices from the database
//         const ingredientPriceMap = new Map();
//         dbIngredients.forEach((ing) => {
//           ingredientPriceMap.set(ing.id, parseFloat(ing.price));
//         });

//         // Calculate ingredient price adjustments using the latest prices
//         for (const ing of ingredients) {
//           if (!ingredientPriceMap.has(ing.id)) {
//             console.warn(`Ingredient with ID ${ing.id} not found or inactive`);
//             continue; // Skip invalid or inactive ingredients
//           }

//           const defaultIng = pizza.defaultIngredients?.find(
//             (di) => di.ingredientId === ing.id
//           );
//           const defaultQuantity = defaultIng ? defaultIng.quantity : 0;
//           const ingPrice = ingredientPriceMap.get(ing.id);

//           if (ing.quantity > defaultQuantity) {
//             ingredientsTotalPrice +=
//               (ing.quantity - defaultQuantity) * ingPrice;
//           } else if (ing.quantity < defaultQuantity) {
//             // Discount for removed ingredients
//             ingredientsTotalPrice -=
//               (defaultQuantity - ing.quantity) * ingPrice;
//           }
//         }

//         // Process toppings
//         const toppings = item.toppings || [];
//         let toppingsTotalPrice = 0;

//         // Fetch all toppings directly from the database to get latest prices
//         const toppingIds = toppings.map((top) => top.id);
//         const dbToppings = await prisma.toppingsList.findMany({
//           where: {
//             id: { in: toppingIds },
//             status: true, // Only include active toppings
//           },
//         });

//         // Map of topping IDs to their latest prices from the database
//         const toppingPriceMap = new Map();
//         dbToppings.forEach((top) => {
//           toppingPriceMap.set(top.id, parseFloat(top.price));
//         });

//         // Calculate topping price adjustments using the latest prices
//         for (const top of toppings) {
//           if (!toppingPriceMap.has(top.id)) {
//             console.warn(`Topping with ID ${top.id} not found or inactive`);
//             continue; // Skip invalid or inactive toppings
//           }

//           const defaultTop = pizza.defaultToppings?.find(
//             (dt) => dt.toppingId === top.id
//           );
//           const defaultQuantity = defaultTop ? defaultTop.quantity : 0;
//           const topPrice = toppingPriceMap.get(top.id);

//           if (top.quantity > defaultQuantity) {
//             toppingsTotalPrice += (top.quantity - defaultQuantity) * topPrice;
//           } else if (top.quantity < defaultQuantity) {
//             // Discount for removed toppings
//             toppingsTotalPrice -= (defaultQuantity - top.quantity) * topPrice;
//           }
//         }

//         // Calculate final unit price
//         let adjustedPrice =
//           basePrice + ingredientsTotalPrice + toppingsTotalPrice;

//         // Ensure price doesn't go below base price
//         adjustedPrice = Math.max(adjustedPrice, basePrice);

//         // Calculate total price for the quantity
//         const eachPrice = Number(adjustedPrice.toFixed(2)); // Round to 2 decimal places
//         const finalPrice = Number((eachPrice * quantity).toFixed(2));

//         // Create validated item with recalculated prices
//         validatedItems.push({
//           ...item,
//           eachprice: eachPrice,
//           basePrice: basePrice,
//           price: finalPrice,
//           finalPrice: finalPrice,
//         });

//         console.log(
//           `Validated item: ${
//             pizza.name
//           }, Size: ${size}, Quantity: ${quantity}, Price: ${finalPrice} (Base: ${basePrice}, Ingredients: +${ingredientsTotalPrice.toFixed(
//             2
//           )}, Toppings: +${toppingsTotalPrice.toFixed(2)})`
//         );
//       }
//     }

//     // Update the cart items with validated prices
//     req.body.cartItems = validatedItems;

//     // Log validation result
//     console.log(`Validated ${validatedItems.length} items`);

//     next();
//   } catch (error) {
//     console.error("Error validating cart prices:", error);
//     return res.status(500).json({ error: "Error validating cart prices" });
//   }
// };



// import prisma from "../lib/prisma.js"; // Use singleton Prisma client
// import { prismaWithRetry } from "../lib/dbRetry.js";

// /**
//  * Middleware to validate and recalculate cart prices before syncing
//  * This ensures that all prices are calculated server-side for security
//  * and prevents price manipulation from the client
//  */
// export const validateCartPrices = async (req, res, next) => {
//   console.log("Validating cart prices...");

//   try {
//     const localItems = req.body.cartItems || [];
//     if (!localItems.length) {
//       return next(); // No items to validate
//     }

//     // Create a validated copy of the cart items
//     const validatedItems = [];
//     for (const item of localItems) {
//   // ADD THIS DEBUG CODE FIRST
//   console.log('\n🔍 === DEBUGGING CART ITEM ===');
//   console.log('Full item structure:', JSON.stringify(item, null, 2));
//   console.log('item.id:', item.id);
//   console.log('item.itemId:', item.itemId);
//   console.log('item.comboStyleItemId:', item.comboStyleItemId);
//   console.log('item.type:', item.type);
//   console.log('item.isCombo:', item.isCombo);
//   console.log('item.isOtherItem:', item.isOtherItem);
//   console.log('🔍 === END DEBUG ===\n');

//   // ... rest of your validation logic
// }

//     for (const item of localItems) {
//       if (item.isCombo) {
//         // For combos, verify the price from database
//         const combo = await prisma.comboOffers.findUnique({
//           where: { id: item.id },
//         });

//         if (!combo) {
//           console.warn(`Combo with ID ${item.id} not found`);
//           continue;
//         }

//         validatedItems.push({
//           ...item,
//           price: Number(combo.price),
//           finalPrice: Number(combo.price) * item.quantity,
//           eachprice: Number(combo.price),
//         });
//       } else if (item.isOtherItem) {
//         // For other items, verify the price from database
//         const otherItem = await prisma.otherItem.findUnique({
//           where: { id: item.id },
//         });

//         if (!otherItem) {
//           console.warn(`OtherItem with ID ${item.id} not found`);
//           continue;
//         }

//         validatedItems.push({
//           ...item,
//           price: Number(otherItem.price),
//           finalPrice: Number(otherItem.price) * item.quantity,
//           eachprice: Number(otherItem.price),
//           isOtherItem: true,
//         });
//       } else if (item.comboStyleItemId) {
//         // **NEW: Validate Combo Style Items**
//         console.log(`\n=== COMBO STYLE ITEM VALIDATION START ===`);
//         console.log(`Validating combo style item: ${item.comboStyleItemId}`);
//         console.log(`Raw item received from user:`, JSON.stringify(item, null, 2));
        
//         // Fetch the combo style item from database
//         const comboStyleItem = await prismaWithRetry(() => 
//           prisma.comboStyleItem.findUnique({
//             where: { id: item.comboStyleItemId },
//           })
//         );

//         if (!comboStyleItem || !comboStyleItem.isActive) {
//           console.warn(`ComboStyleItem with ID ${item.comboStyleItemId} not found or inactive`);
//           continue;
//         }

//         // Parse JSON fields safely
//         const sizePricing = typeof comboStyleItem.sizePricing === 'string' 
//           ? JSON.parse(comboStyleItem.sizePricing) 
//           : comboStyleItem.sizePricing;

//         const mealDealConfig = typeof comboStyleItem.mealDealConfig === 'string'
//           ? JSON.parse(comboStyleItem.mealDealConfig)
//           : comboStyleItem.mealDealConfig;

//         const availableSauces = typeof comboStyleItem.availableSauces === 'string'
//           ? JSON.parse(comboStyleItem.availableSauces)
//           : comboStyleItem.availableSauces;

//         // Validate size exists
//         const size = item.size;
//         if (!sizePricing[size]) {
//           console.warn(`Invalid size ${size} for combo style item ${item.comboStyleItemId}`);
//           continue;
//         }

//         const sizeConfig = sizePricing[size];
//         const mealDealSizeConfig = mealDealConfig[size] || {};

//         // Determine correct price based on meal deal flag
//         let validatedPrice;
//         if (item.isMealDeal) {
//           validatedPrice = parseFloat(sizeConfig.mealDealPrice || sizeConfig.basePrice);
          
//           // **CRITICAL: Validate meal deal selections**
//           const allowedSideCount = parseInt(mealDealSizeConfig.sideCount || 0);
//           const allowedDrinkCount = parseInt(mealDealSizeConfig.drinkCount || 0);

//           // Parse user selections safely
//           let userSides = [];
//           let userDrinks = [];
          
//           console.log(`\n--- USER SELECTIONS RECEIVED ---`);
//           console.log(`Raw selectedSides:`, item.selectedSides);
//           console.log(`Raw selectedDrinks:`, item.selectedDrinks);
//           console.log(`Raw sauce:`, item.sauce);
//           console.log(`Type of selectedSides:`, typeof item.selectedSides);
//           console.log(`Type of selectedDrinks:`, typeof item.selectedDrinks);
          
//           try {
//             if (item.selectedSides) {
//               if (typeof item.selectedSides === 'string') {
//                 userSides = JSON.parse(item.selectedSides);
//                 console.log(`Parsed selectedSides from string:`, userSides);
//               } else if (Array.isArray(item.selectedSides)) {
//                 userSides = item.selectedSides;
//                 console.log(`selectedSides is already an array:`, userSides);
//               }
//             }
//             if (!Array.isArray(userSides)) {
//               console.warn(`selectedSides is not an array for item ${item.comboStyleItemId}, resetting to empty array`);
//               userSides = [];
//             }
//           } catch (error) {
//             console.warn(`Failed to parse selectedSides for item ${item.comboStyleItemId}:`, error.message);
//             userSides = [];
//           }

//           try {
//             if (item.selectedDrinks) {
//               if (typeof item.selectedDrinks === 'string') {
//                 userDrinks = JSON.parse(item.selectedDrinks);
//                 console.log(`Parsed selectedDrinks from string:`, userDrinks);
//               } else if (Array.isArray(item.selectedDrinks)) {
//                 userDrinks = item.selectedDrinks;
//                 console.log(`selectedDrinks is already an array:`, userDrinks);
//               }
//             }
//             if (!Array.isArray(userDrinks)) {
//               console.warn(`selectedDrinks is not an array for item ${item.comboStyleItemId}, resetting to empty array`);
//               userDrinks = [];
//             }
//           } catch (error) {
//             console.warn(`Failed to parse selectedDrinks for item ${item.comboStyleItemId}:`, error.message);
//             userDrinks = [];
//           }

//           // **SECURITY CHECK: Validate and store sides as IDs only**
//           let validatedSideIds = [];
//           if (userSides.length > 0) {
//             // Extract IDs from sides (handle both object and string formats)
//             const sideIds = userSides.map(side => {
//               if (typeof side === 'object' && side.id) {
//                 return side.id; // If side is an object, extract the ID
//               }
//               return side; // If side is already a string ID
//             }).filter(id => id); // Remove any null/undefined values

//             console.log(`Validating side IDs: ${JSON.stringify(sideIds)} for item ${item.comboStyleItemId}`);

//             // **TEMP FIX: Map mock IDs to real database IDs**
//             const mockToRealIdMap = {
//               'side-1': 'cmfijpxn40003uk58upnvocxg', // Chips
//               'side-2': 'cmfijpyct0005uk580cz7tcty', // Coleslaw  
//               'side-3': 'cmfju8om10001uk54vsr1r0jm', // Corn on the Cob
//               'side-4': 'cmfijpz7w0009uk58p2cosnup', // Rice
//               'side-5': 'cmfijpzmc000buk58o782q3m0', // Beans
//               'side-6': 'cmfju8psc0003uk5462xb4mem', // Mashed Potato
//               'side-7': 'cmfju8q9i0005uk54542ifws2'  // Garden Salad
//             };

//             // Convert mock IDs to real IDs
//             const realSideIds = sideIds.map(id => mockToRealIdMap[id] || id).filter(id => id);
//             console.log(`Converted to real side IDs: ${JSON.stringify(realSideIds)}`);

//             // Validate that these real IDs exist in the database
//             const validSides = await prisma.otherItem.findMany({
//               where: {
//                 id: { in: realSideIds }
//               },
//               select: { id: true }
//             });
            
//             validatedSideIds = validSides.map(s => s.id);
            
//             // Take only the allowed number of sides
//             validatedSideIds = validatedSideIds.slice(0, allowedSideCount);
            
//             console.log(`Valid side IDs after validation: ${JSON.stringify(validatedSideIds)}`);
//           }

//           // **SECURITY CHECK: Validate and store drinks as IDs only**
//           let validatedDrinkIds = [];
//           if (userDrinks.length > 0) {
//             // Extract IDs from drinks (handle both object and string formats)
//             const drinkIds = userDrinks.map(drink => {
//               if (typeof drink === 'object' && drink.id) {
//                 return drink.id; // If drink is an object, extract the ID
//               }
//               return drink; // If drink is already a string ID
//             }).filter(id => id); // Remove any null/undefined values

//             console.log(`Validating drink IDs: ${JSON.stringify(drinkIds)} for item ${item.comboStyleItemId}`);

//             // **TEMP FIX: Map mock IDs to real database IDs**
//             const mockToRealIdMap = {
//               'drink-1': 'cmfijq0cf000duk58eywo5d85', // Coca Cola
//               'drink-2': 'cmfijq0yn000fuk58p7v7e1pg', // Pepsi
//               'drink-3': 'cmfju8r6k0007uk54ihx81qv2', // Sprite
//               'drink-4': 'cmfijq1wo000juk58twvtsw2n', // Orange Juice
//               'drink-5': 'cmfijq2dt000luk58b8wf4uqf', // Water
//               'drink-6': 'cmfju8s2s0009uk54096vpj0h', // Lemonade
//               'drink-7': 'cmfju8sjx000buk54f0fgr1cq'  // Iced Tea
//             };

//             // Convert mock IDs to real IDs
//             const realDrinkIds = drinkIds.map(id => mockToRealIdMap[id] || id).filter(id => id);
//             console.log(`Converted to real drink IDs: ${JSON.stringify(realDrinkIds)}`);

//             // Validate that these real IDs exist in the database
//             const validDrinks = await prisma.otherItem.findMany({
//               where: {
//                 id: { in: realDrinkIds }
//               },
//               select: { id: true }
//             });
            
//             validatedDrinkIds = validDrinks.map(d => d.id);
            
//             // Take only the allowed number of drinks
//             validatedDrinkIds = validatedDrinkIds.slice(0, allowedDrinkCount);
            
//             console.log(`Valid drink IDs after validation: ${JSON.stringify(validatedDrinkIds)}`);
//           }

//           // **Store only the validated IDs as JSON strings**
//           item.selectedSides = validatedSideIds.length > 0 ? JSON.stringify(validatedSideIds) : null;
//           item.selectedDrinks = validatedDrinkIds.length > 0 ? JSON.stringify(validatedDrinkIds) : null;

//           console.log(`\n--- FINAL VALIDATION RESULTS ---`);
//           console.log(`Final stored selectedSides:`, item.selectedSides);
//           console.log(`Final stored selectedDrinks:`, item.selectedDrinks);
//           console.log(`Final stored sauce:`, item.sauce);
//           console.log(`Meal Deal Validation - Size: ${size}, Allowed sides: ${allowedSideCount}, Allowed drinks: ${allowedDrinkCount}, Price: £${validatedPrice}`);
//         } else {
//           validatedPrice = parseFloat(sizeConfig.basePrice);
//           console.log(`\n--- NON-MEAL DEAL PROCESSING ---`);
//           console.log(`Base price for non-meal deal: £${validatedPrice}`);
//           console.log(`Incoming selectedSides:`, item.selectedSides);
//           console.log(`Incoming selectedDrinks:`, item.selectedDrinks);
          
//           // For non-meal deals, preserve any existing selections but don't enforce limits
//           // This allows for future flexibility if non-meal deals get selection options
//           if (item.selectedSides && typeof item.selectedSides === 'string') {
//             try {
//               const sideIds = JSON.parse(item.selectedSides);
//               if (Array.isArray(sideIds)) {
//                 item.selectedSides = JSON.stringify(sideIds);
//                 console.log(`Preserved selectedSides:`, item.selectedSides);
//               } else {
//                 item.selectedSides = null;
//                 console.log(`Reset selectedSides to null - not an array`);
//               }
//             } catch (e) {
//               item.selectedSides = null;
//               console.log(`Reset selectedSides to null - parse error:`, e.message);
//             }
//           }
          
//           if (item.selectedDrinks && typeof item.selectedDrinks === 'string') {
//             try {
//               const drinkIds = JSON.parse(item.selectedDrinks);
//               if (Array.isArray(drinkIds)) {
//                 item.selectedDrinks = JSON.stringify(drinkIds);
//                 console.log(`Preserved selectedDrinks:`, item.selectedDrinks);
//               } else {
//                 item.selectedDrinks = null;
//                 console.log(`Reset selectedDrinks to null - not an array`);
//               }
//             } catch (e) {
//               item.selectedDrinks = null;
//               console.log(`Reset selectedDrinks to null - parse error:`, e.message);
//             }
//           }
//         }

//         // **SECURITY CHECK: Validate sauce selection**
//         console.log(`\n--- SAUCE VALIDATION ---`);
//         console.log(`Incoming sauce:`, item.sauce);
//         console.log(`Available sauces:`, availableSauces);
        
//         if (item.sauce && availableSauces.length > 0) {
//           if (!availableSauces.includes(item.sauce)) {
//             console.warn(`Invalid sauce ${item.sauce} for combo style item ${item.comboStyleItemId}. Setting to first available sauce.`);
//             item.sauce = availableSauces[0]; // Use first available sauce as fallback
//           }
//         }
        
//         console.log(`Final sauce after validation:`, item.sauce);

//         // **SECURITY CHECK: Validate quantity**
//         const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

//         // Calculate final prices
//         const eachPrice = Number(validatedPrice.toFixed(2));
//         const finalPrice = Number((eachPrice * quantity).toFixed(2));

//         // Create validated combo style item
//         validatedItems.push({
//           ...item,
//           quantity: quantity,
//           basePrice: parseFloat(sizeConfig.basePrice),
//           eachprice: eachPrice,
//           price: finalPrice,
//           finalPrice: finalPrice,
//           // Ensure boolean flags are properly set
//           isMealDeal: Boolean(item.isMealDeal),
//           isCombo: false,
//           isOtherItem: false,
//           isPeriPeri: false, // For backward compatibility
//         });

//         console.log(`\n--- FINAL ITEM BEING PUSHED TO CART ---`);
//         console.log(JSON.stringify({
//           comboStyleItemId: item.comboStyleItemId,
//           quantity: quantity,
//           size: item.size,
//           sauce: item.sauce,
//           selectedSides: item.selectedSides,
//           selectedDrinks: item.selectedDrinks,
//           isMealDeal: item.isMealDeal,
//           finalPrice: finalPrice
//         }, null, 2));

//         console.log(`Validated combo style item: ${comboStyleItem.name}, Size: ${size}, Meal Deal: ${item.isMealDeal}, Quantity: ${quantity}, Price: £${finalPrice}`);
//         console.log(`=== COMBO STYLE ITEM VALIDATION END ===\n`);

//       } else {
//         // Extract the item details
//         const pizzaId = item.pizzaId || item.pizza?.id || item.id;
//         const size = item.size || "Medium";
//         const quantity = parseInt(item.quantity, 10) || 1;

//         if (!pizzaId) {
//           console.warn("Skipping item with missing pizzaId:", item);
//           continue;
//         }

//         // Fetch the pizza from the database with relations
//         const pizza = await prisma.pizza.findUnique({
//           where: { id: pizzaId },
//           include: {
//             defaultIngredients: {
//               include: {
//                 ingredient: true, // Include actual ingredient data from IngredientsList
//               },
//             },
//             defaultToppings: {
//               include: {
//                 topping: true, // Include actual topping data from ToppingsList
//               },
//             },
//           },
//         });

//         if (!pizza) {
//           console.warn(`Pizza with ID ${pizzaId} not found`);
//           continue;
//         }

//         // Parse pizza sizes
//         const sizes =
//           typeof pizza.sizes === "string"
//             ? JSON.parse(pizza.sizes)
//             : pizza.sizes;

//         // Get base price for the selected size - standardize size names for comparison
//         const sizeUpper = size.toUpperCase();
//         let basePrice = parseFloat(sizes.MEDIUM || 0);
//         if (sizeUpper === "MEDIUM" && sizes.MEDIUM) {
//           basePrice = parseFloat(sizes.MEDIUM);
//         } else if (sizeUpper === "LARGE" && sizes.LARGE) {
//           basePrice = parseFloat(sizes.LARGE);
//         } else if (sizeUpper === "SUPER_SIZE" && sizes.SUPER_SIZE) {
//           basePrice = parseFloat(sizes.SUPER_SIZE);
//         }

//         // Process ingredients
//         const ingredients = item.ingredients || [];
//         let ingredientsTotalPrice = 0;

//         // Fetch all ingredients directly from the database to get latest prices
//         const ingredientIds = ingredients.map((ing) => ing.id);
//         const dbIngredients = await prisma.ingredientsList.findMany({
//           where: {
//             id: { in: ingredientIds },
//             status: true, // Only include active ingredients
//           },
//         });

//         // Map of ingredient IDs to their latest prices from the database
//         const ingredientPriceMap = new Map();
//         dbIngredients.forEach((ing) => {
//           ingredientPriceMap.set(ing.id, parseFloat(ing.price));
//         });

//         // Calculate ingredient price adjustments using the latest prices
//         for (const ing of ingredients) {
//           if (!ingredientPriceMap.has(ing.id)) {
//             console.warn(`Ingredient with ID ${ing.id} not found or inactive`);
//             continue; // Skip invalid or inactive ingredients
//           }

//           const defaultIng = pizza.defaultIngredients?.find(
//             (di) => di.ingredientId === ing.id
//           );
//           const defaultQuantity = defaultIng ? defaultIng.quantity : 0;
//           const ingPrice = ingredientPriceMap.get(ing.id);

//           if (ing.quantity > defaultQuantity) {
//             ingredientsTotalPrice +=
//               (ing.quantity - defaultQuantity) * ingPrice;
//           } else if (ing.quantity < defaultQuantity) {
//             // Discount for removed ingredients
//             ingredientsTotalPrice -=
//               (defaultQuantity - ing.quantity) * ingPrice;
//           }
//         }

//         // Process toppings
//         const toppings = item.toppings || [];
//         let toppingsTotalPrice = 0;

//         // Fetch all toppings directly from the database to get latest prices
//         const toppingIds = toppings.map((top) => top.id);
//         const dbToppings = await prisma.toppingsList.findMany({
//           where: {
//             id: { in: toppingIds },
//             status: true, // Only include active toppings
//           },
//         });

//         // Map of topping IDs to their latest prices from the database
//         const toppingPriceMap = new Map();
//         dbToppings.forEach((top) => {
//           toppingPriceMap.set(top.id, parseFloat(top.price));
//         });

//         // Calculate topping price adjustments using the latest prices
//         for (const top of toppings) {
//           if (!toppingPriceMap.has(top.id)) {
//             console.warn(`Topping with ID ${top.id} not found or inactive`);
//             continue; // Skip invalid or inactive toppings
//           }

//           const defaultTop = pizza.defaultToppings?.find(
//             (dt) => dt.toppingId === top.id
//           );
//           const defaultQuantity = defaultTop ? defaultTop.quantity : 0;
//           const topPrice = toppingPriceMap.get(top.id);

//           if (top.quantity > defaultQuantity) {
//             toppingsTotalPrice += (top.quantity - defaultQuantity) * topPrice;
//           } else if (top.quantity < defaultQuantity) {
//             // Discount for removed toppings
//             toppingsTotalPrice -= (defaultQuantity - top.quantity) * topPrice;
//           }
//         }

//         // Calculate final unit price
//         let adjustedPrice =
//           basePrice + ingredientsTotalPrice + toppingsTotalPrice;

//         // Ensure price doesn't go below base price
//         adjustedPrice = Math.max(adjustedPrice, basePrice);

//         // Calculate total price for the quantity
//         const eachPrice = Number(adjustedPrice.toFixed(2)); // Round to 2 decimal places
//         const finalPrice = Number((eachPrice * quantity).toFixed(2));

//         // Create validated item with recalculated prices
//         validatedItems.push({
//           ...item,
//           eachprice: eachPrice,
//           basePrice: basePrice,
//           price: finalPrice,
//           finalPrice: finalPrice,
//         });

//         console.log(
//           `Validated item: ${
//             pizza.name
//           }, Size: ${size}, Quantity: ${quantity}, Price: ${finalPrice} (Base: ${basePrice}, Ingredients: +${ingredientsTotalPrice.toFixed(
//             2
//           )}, Toppings: +${toppingsTotalPrice.toFixed(2)})`
//         );
//       }
//     }

//     // Update the cart items with validated prices
//     req.body.cartItems = validatedItems;

//     // Log validation result
//     console.log(`Validated ${validatedItems.length} items`);

//     next();
//   } catch (error) {
//     console.error("Error validating cart prices:", error);
//     return res.status(500).json({ error: "Error validating cart prices" });
//   }
// };

import prisma from "../lib/prisma.js";
import { prismaWithRetry } from "../lib/dbRetry.js";

export const validateCartPrices = async (req, res, next) => {
  console.log("Validating cart prices...");

  try {
    const localItems = req.body.cartItems || [];
    if (!localItems.length) {
      return next();
    }

    const validatedItems = [];

    for (const item of localItems) {
      console.log('\n🔍 === DEBUGGING CART ITEM ===');
      console.log('item.type:', item.type);
      console.log('item.itemId:', item.itemId);
      console.log('item.comboStyleItemId:', item.comboStyleItemId);
      console.log('item.isCombo:', item.isCombo);
      console.log('item.isOtherItem:', item.isOtherItem);
      console.log('🔍 === END DEBUG ===\n');

      if (item.isCombo) {
        // Handle combo offers
        const combo = await prisma.comboOffers.findUnique({
          where: { id: item.id },
        });

        if (!combo) {
          console.warn(`Combo with ID ${item.id} not found`);
          continue;
        }

        validatedItems.push({
          ...item,
          price: Number(combo.price),
          finalPrice: Number(combo.price) * item.quantity,
          eachprice: Number(combo.price),
        });

      } else if (item.isOtherItem) {
        // Handle other items
        const otherItem = await prisma.otherItem.findUnique({
          where: { id: item.id },
        });

        if (!otherItem) {
          console.warn(`OtherItem with ID ${item.id} not found`);
          continue;
        }

        validatedItems.push({
          ...item,
          price: Number(otherItem.price),
          finalPrice: Number(otherItem.price) * item.quantity,
          eachprice: Number(otherItem.price),
          isOtherItem: true,
        });

      } else if (item.type === 'comboStyleItem' || item.comboStyleItemId || item.isComboStyleItem) {
        // **FIXED: Handle Combo Style Items with multiple identification methods**
        console.log(`\n=== COMBO STYLE ITEM VALIDATION START ===`);
        
        // Get the actual combo style item ID
        const comboStyleItemId = item.comboStyleItemId || item.itemId;
        
        if (!comboStyleItemId) {
          console.warn('❌ No combo style item ID found');
          continue;
        }

        console.log(`Validating combo style item: ${comboStyleItemId}`);
        
        // Fetch the combo style item from database
        const comboStyleItem = await prismaWithRetry(() => 
          prisma.comboStyleItem.findUnique({
            where: { id: comboStyleItemId },
          })
        );

        if (!comboStyleItem || !comboStyleItem.isActive) {
          console.warn(`ComboStyleItem with ID ${comboStyleItemId} not found or inactive`);
          continue;
        }

        // Parse JSON fields safely
        const sizePricing = typeof comboStyleItem.sizePricing === 'string' 
          ? JSON.parse(comboStyleItem.sizePricing) 
          : comboStyleItem.sizePricing;

        const mealDealConfig = typeof comboStyleItem.mealDealConfig === 'string'
          ? JSON.parse(comboStyleItem.mealDealConfig)
          : comboStyleItem.mealDealConfig;

        const availableSauces = typeof comboStyleItem.availableSauces === 'string'
          ? JSON.parse(comboStyleItem.availableSauces)
          : comboStyleItem.availableSauces;

        // Validate size exists
        const size = item.size;
        if (!sizePricing[size]) {
          console.warn(`Invalid size ${size} for combo style item ${comboStyleItemId}`);
          continue;
        }

        const sizeConfig = sizePricing[size];
        const mealDealSizeConfig = mealDealConfig[size] || {};

        // Determine correct price based on meal deal flag
        let validatedPrice;
        
        if (item.isMealDeal) {
          validatedPrice = parseFloat(sizeConfig.mealDealPrice || sizeConfig.basePrice);
          
          // Get meal deal configuration
          const allowedSideCount = parseInt(mealDealSizeConfig.sides?.count || 0);
          const allowedDrinkCount = parseInt(mealDealSizeConfig.drinks?.count || 0);

          console.log(`Meal Deal - Allowed sides: ${allowedSideCount}, drinks: ${allowedDrinkCount}`);

          // Parse user selections safely
          let userSides = [];
          let userDrinks = [];
          
          // Handle sides
          if (item.selectedSides) {
            if (Array.isArray(item.selectedSides)) {
              userSides = item.selectedSides;
            } else if (typeof item.selectedSides === 'string') {
              try {
                userSides = JSON.parse(item.selectedSides);
              } catch (e) {
                console.warn('Failed to parse selectedSides:', e.message);
                userSides = [];
              }
            }
          }

          // Handle drinks
          if (item.selectedDrinks) {
            if (Array.isArray(item.selectedDrinks)) {
              userDrinks = item.selectedDrinks;
            } else if (typeof item.selectedDrinks === 'string') {
              try {
                userDrinks = JSON.parse(item.selectedDrinks);
              } catch (e) {
                console.warn('Failed to parse selectedDrinks:', e.message);
                userDrinks = [];
              }
            }
          }

          console.log(`User selected sides: ${JSON.stringify(userSides)}`);
          console.log(`User selected drinks: ${JSON.stringify(userDrinks)}`);

          // Validate sides (remove mock mapping, use real IDs)
          let validatedSideIds = [];
          if (userSides.length > 0 && allowedSideCount > 0) {
            const sidesCategoryId = mealDealSizeConfig.sides?.categoryId;
            
            if (sidesCategoryId) {
              const validSides = await prisma.otherItem.findMany({
                where: {
                  id: { in: userSides },
                  categoryId: sidesCategoryId
                },
                select: { id: true }
              });
              
              validatedSideIds = validSides.map(s => s.id).slice(0, allowedSideCount);
              console.log(`Validated side IDs: ${JSON.stringify(validatedSideIds)}`);
            }
          }

          // Validate drinks (remove mock mapping, use real IDs)
          let validatedDrinkIds = [];
          if (userDrinks.length > 0 && allowedDrinkCount > 0) {
            const drinksCategoryId = mealDealSizeConfig.drinks?.categoryId;
            
            if (drinksCategoryId) {
              const validDrinks = await prisma.otherItem.findMany({
                where: {
                  id: { in: userDrinks },
                  categoryId: drinksCategoryId
                },
                select: { id: true }
              });
              
              validatedDrinkIds = validDrinks.map(d => d.id).slice(0, allowedDrinkCount);
              console.log(`Validated drink IDs: ${JSON.stringify(validatedDrinkIds)}`);
            }
          }

          // Update item with validated selections
          item.selectedSides = validatedSideIds.length > 0 ? JSON.stringify(validatedSideIds) : null;
          item.selectedDrinks = validatedDrinkIds.length > 0 ? JSON.stringify(validatedDrinkIds) : null;

        } else {
          validatedPrice = parseFloat(sizeConfig.basePrice);
          console.log(`Non-meal deal - Base price: £${validatedPrice}`);
          
          // For non-meal deals, clear meal deal selections
          item.selectedSides = null;
          item.selectedDrinks = null;
        }

        // Validate sauce selection
        if (item.sauce && availableSauces.length > 0) {
          if (!availableSauces.includes(item.sauce)) {
            console.warn(`Invalid sauce ${item.sauce}, setting to first available sauce`);
            item.sauce = availableSauces[0];
          }
        }

        // Validate quantity
        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

        // Calculate final prices
        const eachPrice = Number(validatedPrice.toFixed(2));
        const finalPrice = Number((eachPrice * quantity).toFixed(2));

        // Create validated combo style item
        validatedItems.push({
          ...item,
          comboStyleItemId: comboStyleItemId, // Ensure this field is set
          quantity: quantity,
          basePrice: parseFloat(sizeConfig.basePrice),
          eachprice: eachPrice,
          price: finalPrice,
          finalPrice: finalPrice,
          isMealDeal: Boolean(item.isMealDeal),
          isCombo: false,
          isOtherItem: false,
          isPeriPeri: false,
        });

        console.log(`✅ Validated combo style item: ${comboStyleItem.name}, Price: £${finalPrice}`);
        console.log(`=== COMBO STYLE ITEM VALIDATION END ===\n`);

      } else {
        // Handle regular pizzas
        const pizzaId = item.pizzaId || item.pizza?.id || item.id;
        const size = item.size || "Medium";
        const quantity = parseInt(item.quantity, 10) || 1;

        if (!pizzaId) {
          console.warn("Skipping item with missing pizzaId:", item);
          continue;
        }

        const pizza = await prisma.pizza.findUnique({
          where: { id: pizzaId },
          include: {
            defaultIngredients: {
              include: { ingredient: true },
            },
            defaultToppings: {
              include: { topping: true },
            },
          },
        });

        if (!pizza) {
          console.warn(`Pizza with ID ${pizzaId} not found`);
          continue;
        }

        // Parse pizza sizes
        const sizes = typeof pizza.sizes === "string" ? JSON.parse(pizza.sizes) : pizza.sizes;

        // Get base price for the selected size
        const sizeUpper = size.toUpperCase();
        let basePrice = parseFloat(sizes.MEDIUM || 0);
        if (sizeUpper === "MEDIUM" && sizes.MEDIUM) {
          basePrice = parseFloat(sizes.MEDIUM);
        } else if (sizeUpper === "LARGE" && sizes.LARGE) {
          basePrice = parseFloat(sizes.LARGE);
        } else if (sizeUpper === "SUPER_SIZE" && sizes.SUPER_SIZE) {
          basePrice = parseFloat(sizes.SUPER_SIZE);
        }

        // Calculate ingredient adjustments
        const ingredients = item.ingredients || [];
        let ingredientsTotalPrice = 0;

        const ingredientIds = ingredients.map((ing) => ing.id);
        const dbIngredients = await prisma.ingredientsList.findMany({
          where: { id: { in: ingredientIds }, status: true },
        });

        const ingredientPriceMap = new Map();
        dbIngredients.forEach((ing) => {
          ingredientPriceMap.set(ing.id, parseFloat(ing.price));
        });

        for (const ing of ingredients) {
          if (!ingredientPriceMap.has(ing.id)) continue;

          const defaultIng = pizza.defaultIngredients?.find((di) => di.ingredientId === ing.id);
          const defaultQuantity = defaultIng ? defaultIng.quantity : 0;
          const ingPrice = ingredientPriceMap.get(ing.id);

          if (ing.quantity > defaultQuantity) {
            ingredientsTotalPrice += (ing.quantity - defaultQuantity) * ingPrice;
          } else if (ing.quantity < defaultQuantity) {
            ingredientsTotalPrice -= (defaultQuantity - ing.quantity) * ingPrice;
          }
        }

        // Calculate topping adjustments
        const toppings = item.toppings || [];
        let toppingsTotalPrice = 0;

        const toppingIds = toppings.map((top) => top.id);
        const dbToppings = await prisma.toppingsList.findMany({
          where: { id: { in: toppingIds }, status: true },
        });

        const toppingPriceMap = new Map();
        dbToppings.forEach((top) => {
          toppingPriceMap.set(top.id, parseFloat(top.price));
        });

        for (const top of toppings) {
          if (!toppingPriceMap.has(top.id)) continue;

          const defaultTop = pizza.defaultToppings?.find((dt) => dt.toppingId === top.id);
          const defaultQuantity = defaultTop ? defaultTop.quantity : 0;
          const topPrice = toppingPriceMap.get(top.id);

          if (top.quantity > defaultQuantity) {
            toppingsTotalPrice += (top.quantity - defaultQuantity) * topPrice;
          } else if (top.quantity < defaultQuantity) {
            toppingsTotalPrice -= (defaultQuantity - top.quantity) * topPrice;
          }
        }

        // Calculate final price
        let adjustedPrice = basePrice + ingredientsTotalPrice + toppingsTotalPrice;
        adjustedPrice = Math.max(adjustedPrice, basePrice);

        const eachPrice = Number(adjustedPrice.toFixed(2));
        const finalPrice = Number((eachPrice * quantity).toFixed(2));

        validatedItems.push({
          ...item,
          eachprice: eachPrice,
          basePrice: basePrice,
          price: finalPrice,
          finalPrice: finalPrice,
        });

        console.log(`Validated pizza: ${pizza.name}, Price: £${finalPrice}`);
      }
    }

    // Update the cart items with validated prices
    req.body.cartItems = validatedItems;
    console.log(`✅ Validated ${validatedItems.length} items`);

    next();
  } catch (error) {
    console.error("Error validating cart prices:", error);
    return res.status(500).json({ error: "Error validating cart prices" });
  }
};