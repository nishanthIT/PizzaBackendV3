
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
              // Extract just the IDs from the objects
              const sideIds = userSides.map(side => side.id);
              
              const validSides = await prisma.otherItem.findMany({
                where: {
                  id: { in: sideIds },
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
              // Extract just the IDs from the objects
              const drinkIds = userDrinks.map(drink => drink.id);
              
              const validDrinks = await prisma.otherItem.findMany({
                where: {
                  id: { in: drinkIds },
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

      } else if (item.type === 'userChoice') {
        // **NEW: Handle User Choice Items**
        console.log(`\n=== USER CHOICE VALIDATION START ===`);
        console.log(`Validating user choice item: ${item.id}`);
        console.log(`Raw item received:`, JSON.stringify(item, null, 2));
        
        // Fetch the user choice from database
        const userChoice = await prismaWithRetry(() => 
          prisma.userChoice.findUnique({
            where: { id: item.id },
            include: {
              displayCategory: true
            }
          })
        );

        if (!userChoice || !userChoice.isActive) {
          console.warn(`❌ UserChoice with ID ${item.id} not found or inactive`);
          continue;
        }

        console.log(`✅ Found user choice: ${userChoice.name}`);
        
        // **CRITICAL: Validate user selections against database constraints**
        const userSelections = item.selectedItems || {};
        let isValidSelection = true;
        let totalSelectedCount = 0;

        // Parse categoryConfigs from JSON field
        const categoryConfigs = typeof userChoice.categoryConfigs === 'string' 
          ? JSON.parse(userChoice.categoryConfigs) 
          : userChoice.categoryConfigs || [];

        // Validate each category configuration
        for (const categoryConfig of categoryConfigs) {
          const categoryId = categoryConfig.categoryId;
          const requiredCount = categoryConfig.itemCount;
          const userSelectedInCategory = userSelections[categoryId] || [];
          
          console.log(`📊 Category ${categoryConfig.type} (ID: ${categoryId}): Required=${requiredCount}, Unique Items=${userSelectedInCategory.length}`);
          
          // Count total selected items accounting for quantities
          const categorySelectedCount = userSelectedInCategory.reduce((sum, selectedItem) => {
            return sum + (selectedItem.quantity || 1);
          }, 0);
          
          console.log(`📊 Total quantity selected in category: ${categorySelectedCount} (counting item quantities)`);
          
          totalSelectedCount += categorySelectedCount;
          
          // **SECURITY CHECK: Verify selection count matches requirement**
          if (categorySelectedCount !== requiredCount) {
            console.warn(`❌ Invalid selection count for category ${categoryId}: required=${requiredCount}, selected=${categorySelectedCount}`);
            isValidSelection = false;
            break;
          }
          
          // **SECURITY CHECK: Validate that all selected items exist in the correct category**
          if (userSelectedInCategory.length > 0) {
            const selectedItemIds = userSelectedInCategory.map(item => item.id);
            
            // Determine the correct table to check based on category type
            let validationQuery;
            console.log(`🔍 Category config for validation:`, categoryConfig);
            
            // Use 'type' field from categoryConfig (not 'categoryType')
            const categoryType = categoryConfig.type || categoryConfig.categoryType;
            
            if (categoryType === 'pizza') {
              validationQuery = prisma.pizza.findMany({
                where: {
                  id: { in: selectedItemIds },
                  categoryId: categoryConfig.categoryId
                },
                select: { id: true, name: true }
              });
            } else if (categoryType === 'comboStyle') {
              validationQuery = prisma.comboStyleItem.findMany({
                where: {
                  id: { in: selectedItemIds },
                  isActive: true
                },
                select: { id: true, name: true }
              });
            } else {
              // For other category types (sides, drinks, etc.), check otherItem table
              validationQuery = prisma.otherItem.findMany({
                where: {
                  id: { in: selectedItemIds },
                  categoryId: categoryConfig.categoryId
                },
                select: { id: true, name: true }
              });
            }
            
            const validItems = await validationQuery;
            const validItemIds = validItems.map(item => item.id);
            
            console.log(`🔍 Valid items in category ${categoryId}:`, validItems.map(i => i.name));
            
            // Check if all selected items are valid
            const invalidItems = selectedItemIds.filter(id => !validItemIds.includes(id));
            if (invalidItems.length > 0) {
              console.warn(`❌ Invalid items found in category ${categoryId}:`, invalidItems);
              isValidSelection = false;
              break;
            }
          }
        }

        if (!isValidSelection) {
          console.warn(`❌ User choice validation failed for item ${item.id}`);
          continue; // Skip this invalid item
        }

        // **SECURITY CHECK: Validate the price**
        const expectedPrice = parseFloat(userChoice.basePrice);
        const receivedPrice = parseFloat(item.basePrice || item.price || item.eachprice || 0);
        
        if (Math.abs(expectedPrice - receivedPrice) > 0.01) { // Allow for minor rounding differences
          console.warn(`❌ Price mismatch for user choice ${item.id}: expected=${expectedPrice}, received=${receivedPrice}`);
          // Continue with database price, not user-provided price
        }

        // **SECURITY CHECK: Validate quantity**
        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

        // Calculate final prices using database values
        const eachPrice = Number(expectedPrice.toFixed(2));
        const finalPrice = Number((eachPrice * quantity).toFixed(2));

        // Create validated user choice item
        validatedItems.push({
          ...item,
          quantity: quantity,
          basePrice: expectedPrice,
          eachprice: eachPrice,
          price: finalPrice,
          finalPrice: finalPrice,
          // Preserve the validated selectedItems structure
          selectedItems: userSelections,
          // Store additional metadata for order processing
          totalSelectedItems: totalSelectedCount,
          userChoiceName: userChoice.name,
          categoryConfigs: userChoice.categoryConfigs
        });

        console.log(`✅ Validated user choice: ${userChoice.name}, Quantity: ${quantity}, Price: £${finalPrice}`);
        console.log(`📊 Total items selected across all categories: ${totalSelectedCount}`);
        console.log(`=== USER CHOICE VALIDATION END ===\n`);

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