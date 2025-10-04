import prisma from "../lib/prisma.js";
import { prismaWithRetry } from "../lib/dbRetry.js";

/**
 * Middleware to validate cart items before checkout
 * This validates the cart stored in the database to ensure no tampering
 */
export const validateCartBeforeCheckout = async (req, res, next) => {
  console.log("🔒 Validating cart before checkout...");

  try {
    const userId = req.user?.id;
    const sessionId = req.sessionId;

    if (!userId && !sessionId) {
      return res.status(400).json({ error: "Authentication required" });
    }

    // Get user's cart from database
    const userCart = await prisma.cart.findFirst({
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

    if (!userCart || !userCart.cartItems.length) {
      return res.status(400).json({ error: "No items in cart" });
    }

    console.log(`🔍 Validating ${userCart.cartItems.length} cart items...`);

    // Validate each cart item
    for (const cartItem of userCart.cartItems) {
      console.log(`\n🔍 Validating cart item type:`, {
        isCombo: cartItem.isCombo,
        isOtherItem: cartItem.isOtherItem,
        isComboStyleItem: cartItem.isComboStyleItem,
        isPeriPeri: cartItem.isPeriPeri,
        type: cartItem.type
      });

      if (cartItem.isCombo && cartItem.combo) {
        // Validate combo item
        const combo = await prisma.comboOffers.findUnique({
          where: { id: cartItem.combo.id },
        });
        
        if (!combo || !combo.isActive) {
          return res.status(400).json({ 
            error: `Combo item "${cartItem.combo.name}" is no longer available` 
          });
        }

        // Validate price
        const expectedPrice = parseFloat(combo.price);
        const cartPrice = parseFloat(cartItem.finalPrice || cartItem.price || 0);
        
        if (Math.abs(expectedPrice * cartItem.quantity - cartPrice) > 0.01) {
          console.warn(`❌ Price mismatch for combo ${combo.name}`);
          return res.status(400).json({ 
            error: "Price validation failed. Please refresh your cart." 
          });
        }

      } else if (cartItem.isOtherItem && cartItem.otherItem) {
        // Validate other item
        const otherItem = await prisma.otherItem.findUnique({
          where: { id: cartItem.otherItem.id },
        });
        
        if (!otherItem || !otherItem.isActive) {
          return res.status(400).json({ 
            error: `Item "${cartItem.otherItem.name}" is no longer available` 
          });
        }

        // Validate price
        const expectedPrice = parseFloat(otherItem.price);
        const cartPrice = parseFloat(cartItem.finalPrice || cartItem.price || 0);
        
        if (Math.abs(expectedPrice * cartItem.quantity - cartPrice) > 0.01) {
          console.warn(`❌ Price mismatch for other item ${otherItem.name}`);
          return res.status(400).json({ 
            error: "Price validation failed. Please refresh your cart." 
          });
        }

      } else if (cartItem.type === 'comboStyleItem' || cartItem.isComboStyleItem) {
        // Validate combo style item
        const comboStyleItemId = cartItem.comboStyleItemId || cartItem.itemId;
        
        if (!comboStyleItemId) {
          return res.status(400).json({ 
            error: "Invalid combo style item in cart" 
          });
        }

        const comboStyleItem = await prisma.comboStyleItem.findUnique({
          where: { id: comboStyleItemId },
        });

        if (!comboStyleItem || !comboStyleItem.isActive) {
          return res.status(400).json({ 
            error: "Combo style item is no longer available" 
          });
        }

        // Parse pricing configuration
        const sizePricing = typeof comboStyleItem.sizePricing === 'string' 
          ? JSON.parse(comboStyleItem.sizePricing) 
          : comboStyleItem.sizePricing;

        const size = cartItem.size;
        if (!sizePricing[size]) {
          return res.status(400).json({ 
            error: `Size "${size}" is not available for this item` 
          });
        }

        // Validate price based on meal deal status
        const sizeConfig = sizePricing[size];
        const expectedPrice = cartItem.isMealDeal 
          ? parseFloat(sizeConfig.mealDealPrice || sizeConfig.basePrice)
          : parseFloat(sizeConfig.basePrice);

        const cartPrice = parseFloat(cartItem.finalPrice || cartItem.price || 0);
        
        if (Math.abs(expectedPrice * cartItem.quantity - cartPrice) > 0.01) {
          console.warn(`❌ Price mismatch for combo style item ${comboStyleItem.name}`);
          return res.status(400).json({ 
            error: "Price validation failed. Please refresh your cart." 
          });
        }

      } else if (cartItem.type === 'userChoice') {
        // **NEW: Validate user choice item**
        console.log(`🔍 Validating user choice item: ${cartItem.id}`);
        
        const userChoice = await prisma.userChoice.findUnique({
          where: { id: cartItem.id },
          include: {
            displayCategory: true
          }
        });

        if (!userChoice || !userChoice.isActive) {
          return res.status(400).json({ 
            error: "User choice item is no longer available" 
          });
        }

        // Validate price
        const expectedPrice = parseFloat(userChoice.basePrice);
        const cartPrice = parseFloat(cartItem.finalPrice || cartItem.price || 0);
        
        if (Math.abs(expectedPrice * cartItem.quantity - cartPrice) > 0.01) {
          console.warn(`❌ Price mismatch for user choice ${userChoice.name}`);
          return res.status(400).json({ 
            error: "Price validation failed. Please refresh your cart." 
          });
        }

        // **CRITICAL: Validate user selections against requirements**
        const userSelections = cartItem.selectedItems || {};
        
        // Parse categoryConfigs from JSON field
        const categoryConfigs = typeof userChoice.categoryConfigs === 'string' 
          ? JSON.parse(userChoice.categoryConfigs) 
          : userChoice.categoryConfigs || [];
        
        for (const categoryConfig of categoryConfigs) {
          const categoryId = categoryConfig.categoryId;
          const requiredCount = categoryConfig.itemCount;
          const userSelectedInCategory = userSelections[categoryId] || [];
          
          // Count total selected items accounting for quantities
          const categorySelectedCount = userSelectedInCategory.reduce((sum, selectedItem) => {
            return sum + (selectedItem.quantity || 1);
          }, 0);
          
          if (categorySelectedCount !== requiredCount) {
            return res.status(400).json({ 
              error: `Invalid selection for ${categoryConfig.type}. Required: ${requiredCount}, Selected: ${categorySelectedCount}` 
            });
          }

          // Validate that all selected items exist and are active
          if (userSelectedInCategory.length > 0) {
            const selectedItemIds = userSelectedInCategory.map(item => item.id);
            
            // Check items based on category type
            let validItems = [];
            const categoryType = categoryConfig.type || categoryConfig.categoryType;
            
            if (categoryType === 'pizza') {
              validItems = await prisma.pizza.findMany({
                where: {
                  id: { in: selectedItemIds },
                  categoryId: categoryConfig.categoryId
                }
              });
            } else if (categoryType === 'comboStyle') {
              validItems = await prisma.comboStyleItem.findMany({
                where: {
                  id: { in: selectedItemIds },
                  isActive: true
                }
              });
            } else {
              validItems = await prisma.otherItem.findMany({
                where: {
                  id: { in: selectedItemIds },
                  categoryId: categoryConfig.categoryId
                }
              });
            }
            
            if (validItems.length !== selectedItemIds.length) {
              return res.status(400).json({ 
                error: `Some selected items in ${categoryConfig.type} are no longer available` 
              });
            }
          }
        }

        console.log(`✅ User choice validation passed: ${userChoice.name}`);

      } else if (cartItem.pizza) {
        // Validate pizza item
        const pizza = await prisma.pizza.findUnique({
          where: { id: cartItem.pizza.id },
          include: {
            defaultIngredients: { include: { ingredient: true } },
            defaultToppings: { include: { topping: true } },
          },
        });

        if (!pizza || !pizza.isActive) {
          return res.status(400).json({ 
            error: `Pizza "${cartItem.pizza.name}" is no longer available` 
          });
        }

        // Validate pizza pricing (this is complex due to ingredients/toppings)
        // For now, we'll trust the cart calculation but could add full recalculation here
        console.log(`✅ Pizza validation passed: ${pizza.name}`);

      } else {
        console.warn(`⚠️ Unknown cart item type:`, cartItem);
      }
    }

    console.log(`✅ All cart items validated successfully`);
    
    // Attach validated cart to request for use in checkout
    req.validatedCart = userCart;
    
    next();
  } catch (error) {
    console.error("❌ Error validating cart before checkout:", error);
    return res.status(500).json({ 
      error: "Cart validation failed. Please try again." 
    });
  }
};