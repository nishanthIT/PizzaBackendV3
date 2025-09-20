

// import { PrismaClient } from "@prisma/client";
// import { deleteFile, renameFileToMatchId } from "../utils/fileUtils.js";
// import { calculateComboPrice } from "../utils/calculateComboPrice.js";

// const prisma = new PrismaClient();

// export const addComboOffer = async (req, res) => {
//   let tempImageUrl = req.file?.filename || "dummy.png";

//   try {
//     const { name, description, discount, pizzas, items, manualPrice } = req.body;

//     // Validate required fields
//     if (!name || !description || (!pizzas && !items)) {
//       if (req.file) deleteFile(tempImageUrl);
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Handle both old format (pizzas) and new format (items)
//     let comboItems = [];
    
//     if (items) {
//       // New format with mixed items
//       const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
//       if (!Array.isArray(parsedItems)) {
//         if (req.file) deleteFile(tempImageUrl);
//         return res.status(400).json({ error: "Items must be an array" });
//       }
//       comboItems = parsedItems;
//     } else if (pizzas) {
//       // Backward compatibility with old pizza-only format
//       const parsedPizzas = typeof pizzas === "string" ? JSON.parse(pizzas) : pizzas;
//       if (!Array.isArray(parsedPizzas)) {
//         if (req.file) deleteFile(tempImageUrl);
//         return res.status(400).json({ error: "Pizzas must be an array" });
//       }
//       // Convert pizzas to new format
//       comboItems = parsedPizzas.map(pizza => ({
//         ...pizza,
//         itemType: 'PIZZA'
//       }));
//     }

//     // Validate each item
//     for (const item of comboItems) {
//       if (!item.quantity || item.quantity <= 0) {
//         if (req.file) deleteFile(tempImageUrl);
//         return res.status(400).json({
//           error: "Each item must have a valid quantity",
//         });
//       }

//       if (item.itemType === 'PIZZA') {
//         if (!item.pizzaId || !item.size) {
//           if (req.file) deleteFile(tempImageUrl);
//           return res.status(400).json({
//             error: "Pizza items must have pizzaId and size",
//           });
//         }
//       } else if (item.itemType === 'OTHER_ITEM') {
//         if (!item.otherItemId) {
//           if (req.file) deleteFile(tempImageUrl);
//           return res.status(400).json({
//             error: "Other items must have otherItemId",
//           });
//         }
//       } else {
//         if (req.file) deleteFile(tempImageUrl);
//         return res.status(400).json({
//           error: "Each item must have a valid itemType (PIZZA or OTHER_ITEM)",
//         });
//       }
//     }

//     // Determine final price based on pricing mode
//     let finalPrice;
//     let finalDiscount = 0;

//     if (manualPrice && Number(manualPrice) > 0) {
//       // Manual pricing mode
//       finalPrice = Number(manualPrice);
//       finalDiscount = 0; // No discount when using manual pricing
//     } else {
//       // Percentage discount mode
//       finalDiscount = Number(discount) || 0;
//       finalPrice = await calculateComboPrice(comboItems, finalDiscount);
//     }

//     const combo = await prisma.$transaction(async (tx) => {
//       // Create the combo offer
//       const newCombo = await tx.comboOffers.create({
//         data: {
//           name,
//           description,
//           discount: finalDiscount,
//           price: finalPrice,
//           imageUrl: tempImageUrl,
//         },
//       });

//       // Rename uploaded file if not using dummy image
//       if (tempImageUrl !== "dummy.png") {
//         const newImageUrl = renameFileToMatchId(
//           tempImageUrl,
//           newCombo.id,
//           "combo"
//         );

//         if (newImageUrl) {
//           await tx.comboOffers.update({
//             where: { id: newCombo.id },
//             data: { imageUrl: newImageUrl },
//           });
//           newCombo.imageUrl = newImageUrl;
//         }
//       }

//       // Create combo item relationships using new flexible model
//       for (const item of comboItems) {
//         await tx.comboItem.create({
//           data: {
//             comboId: newCombo.id,
//             pizzaId: item.itemType === 'PIZZA' ? item.pizzaId : null,
//             otherItemId: item.itemType === 'OTHER_ITEM' ? item.otherItemId : null,
//             quantity: Number(item.quantity),
//             size: item.size || null,
//             itemType: item.itemType,
//           },
//         });
//       }

//       // Also maintain backward compatibility with old ComboPizza model for pizzas
//       const pizzaItems = comboItems.filter(item => item.itemType === 'PIZZA');
//       if (pizzaItems.length > 0) {
//         await tx.comboPizza.createMany({
//           data: pizzaItems.map((item) => ({
//             comboId: newCombo.id,
//             pizzaId: item.pizzaId,
//             quantity: Number(item.quantity),
//             size: item.size.toUpperCase(),
//           })),
//         });
//       }

//       return {
//         ...newCombo,
//         imageUrl: `/uploads/${newCombo.imageUrl}`,
//       };
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Combo offer added successfully",
//       data: combo,
//     });
//   } catch (error) {
//     if (req.file) deleteFile(tempImageUrl);
//     console.error("Error adding combo offer:", error);

//     return res.status(500).json({
//       success: false,
//       error: "Failed to add combo offer",
//       details:
//         process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// // Get Combo Offers
// export const getComboOffer = async (req, res) => {
//   try {
//     const combos = await prisma.comboOffers.findMany({
//       include: {
//         pizzas: {
//           include: {
//             pizza: true,
//           },
//         },
//         comboItems: {
//           include: {
//             pizza: true,
//             otherItem: true,
//           },
//         },
//       },
//     });

//     const combosWithPrice = await Promise.all(
//       combos.map(async (combo) => {
//         let items = [];
//         let finalPrice = combo.price;

//         // Use new comboItems if available, fall back to old pizzas format
//         if (combo.comboItems && combo.comboItems.length > 0) {
//           // New format with mixed items
//           items = combo.comboItems.map((item) => ({
//             id: item.id,
//             itemType: item.itemType,
//             pizzaId: item.pizzaId,
//             otherItemId: item.otherItemId,
//             size: item.size,
//             quantity: item.quantity,
//             pizza: item.pizza,
//             otherItem: item.otherItem,
//           }));

//           // Recalculate price if using percentage discount
//           if (combo.discount > 0) {
//             try {
//               finalPrice = await calculateComboPrice(items, combo.discount);
//             } catch (error) {
//               console.error("Error recalculating combo price:", error);
//               finalPrice = combo.price; // Fall back to stored price
//             }
//           }
//         } else {
//           // Backward compatibility: convert old pizzas format
//           items = combo.pizzas.map((item) => ({
//             id: item.id,
//             itemType: 'PIZZA',
//             pizzaId: item.pizza.id,
//             otherItemId: null,
//             size: item.size,
//             quantity: item.quantity,
//             pizza: item.pizza,
//             otherItem: null,
//           }));

//           // Recalculate price for old format
//           if (combo.discount > 0) {
//             const pizzaItems = combo.pizzas.map((item) => ({
//               pizzaId: item.pizza.id,
//               size: item.size,
//               quantity: item.quantity,
//               itemType: 'PIZZA',
//             }));

//             try {
//               finalPrice = await calculateComboPrice(pizzaItems, combo.discount);
//             } catch (error) {
//               console.error("Error recalculating combo price:", error);
//               finalPrice = combo.price;
//             }
//           }
//         }

//         return {
//           ...combo,
//           items,
//           price: finalPrice,
//           imageUrl: `/uploads/${combo.imageUrl}`,
//         };
//       })
//     );

//     res.status(200).json(combosWithPrice);
//   } catch (error) {
//     console.error("Error in getComboOffer:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

// // Edit Combo Offer
// export const editComboOffer = async (req, res) => {
//   try {
//     const { id } = req.body; // combo id
//     const { name, description, discount, pizzas, comboItems, manualPrice } = req.body;
//     const tempImageUrl = req.file ? req.file.filename : null;

//     const existingCombo = await prisma.comboOffers.findUnique({
//       where: { id: id },
//     });

//     if (!existingCombo) {
//       if (req.file) deleteFile(req.file.filename);
//       return res.status(404).json({ error: "Combo Offer not found" });
//     }

//     let items = [];
    
//     // Handle new comboItems format
//     if (comboItems) {
//       const parsedComboItems = typeof comboItems === "string" ? JSON.parse(comboItems) : comboItems;
//       if (!Array.isArray(parsedComboItems)) {
//         return res.status(400).json({ error: "ComboItems must be an array" });
//       }
      
//       // Validate each combo item
//       for (const item of parsedComboItems) {
//         if (!item.quantity || !item.itemType) {
//           return res.status(400).json({
//             error: "Each combo item must have quantity and itemType",
//           });
//         }
//         if (item.itemType === 'PIZZA' && (!item.pizzaId || !item.size)) {
//           return res.status(400).json({
//             error: "Pizza items must have pizzaId and size",
//           });
//         }
//         if (item.itemType === 'OTHER_ITEM' && !item.otherItemId) {
//           return res.status(400).json({
//             error: "Other items must have otherItemId",
//           });
//         }
//       }
      
//       items = parsedComboItems;
//     }
//     // Handle legacy pizzas format for backward compatibility
//     else if (pizzas) {
//       const parsedPizzas = typeof pizzas === "string" ? JSON.parse(pizzas) : pizzas;
//       if (!Array.isArray(parsedPizzas)) {
//         return res.status(400).json({ error: "Pizzas must be an array" });
//       }

//       // Validate each pizza has required fields
//       for (const pizza of parsedPizzas) {
//         if (!pizza.pizzaId || !pizza.quantity || !pizza.size) {
//           return res.status(400).json({
//             error: "Each pizza must have pizzaId, quantity, and size",
//           });
//         }
//       }
      
//       // Convert legacy pizza format to new comboItems format
//       items = parsedPizzas.map(pizza => ({
//         pizzaId: pizza.pizzaId,
//         quantity: pizza.quantity,
//         size: pizza.size,
//         itemType: 'PIZZA'
//       }));
//     } else {
//       return res.status(400).json({ error: "Either comboItems or pizzas must be provided" });
//     }

//     // Determine final price based on pricing mode
//     let finalPrice;
//     let finalDiscount = 0;

//     if (manualPrice && Number(manualPrice) > 0) {
//       // Manual pricing mode
//       finalPrice = Number(manualPrice);
//       finalDiscount = 0; // No discount when using manual pricing
//     } else {
//       // Percentage discount mode
//       finalDiscount = Number(discount) || 0;
//       finalPrice = await calculateComboPrice(items, finalDiscount);
//     }

//     const updatedCombo = await prisma.$transaction(async (tx) => {
//       // If a new image was uploaded, delete the old one
//       if (tempImageUrl && existingCombo.imageUrl !== "dummy.png") {
//         deleteFile(existingCombo.imageUrl);
//       }

//       // Update the combo with the new data
//       const combo = await tx.comboOffers.update({
//         where: { id: id },
//         data: {
//           name,
//           description,
//           discount: finalDiscount,
//           price: finalPrice,
//           imageUrl: tempImageUrl || existingCombo.imageUrl,
//         },
//       });

//       // If a new image was uploaded, rename it to match the combo ID
//       if (tempImageUrl) {
//         const newImageUrl = renameFileToMatchId(
//           tempImageUrl,
//           combo.id,
//           "combo"
//         );

//         // Update the combo with the new image URL if renaming was successful
//         if (newImageUrl) {
//           await tx.comboOffers.update({
//             where: { id: combo.id },
//             data: { imageUrl: newImageUrl },
//           });
//           combo.imageUrl = newImageUrl;
//         }
//       }

//       // Delete existing combo relationships
//       await tx.comboPizza.deleteMany({
//         where: { comboId: id },
//       });
//       await tx.comboItem.deleteMany({
//         where: { comboId: id },
//       });

//       // Create new combo items based on the new structure
//       const comboItemsData = items.map((item) => ({
//         comboId: id,
//         pizzaId: item.itemType === 'PIZZA' ? item.pizzaId : null,
//         otherItemId: item.itemType === 'OTHER_ITEM' ? item.otherItemId : null,
//         quantity: item.quantity,
//         size: item.size || null,
//         itemType: item.itemType,
//       }));

//       await tx.comboItem.createMany({ data: comboItemsData });

//       return {
//         ...combo,
//         imageUrl: `/uploads/${combo.imageUrl}`,
//         comboItems: items,
//       };
//     });

//     res.status(200).json({ message: "Combo Offer Updated", data: updatedCombo });
//   } catch (error) {
//     if (req.file) deleteFile(req.file.filename);
//     console.error("Error in editComboOffer:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

// export const deleteComboOffer = async (req, res) => {
//   try {
//     const { comboId } = req.body;

//     if (!comboId) {
//       return res.status(400).json({ error: "comboId is required" });
//     }

//     const existingCombo = await prisma.comboOffers.findUnique({
//       where: { id: comboId },
//     });

//     if (!existingCombo) {
//       return res.status(404).json({ error: "Combo Offer not found" });
//     }

//     // Delete the image file if it's not the default
//     if (existingCombo.imageUrl !== "dummy.png") {
//       deleteFile(existingCombo.imageUrl);
//     }

//     await prisma.$transaction(async (tx) => {
//       await tx.comboPizza.deleteMany({
//         where: { comboId },
//       });

//       await tx.comboOffers.delete({
//         where: { id: comboId },
//       });
//     });

//     res.status(200).json({ message: "Combo Offer Deleted" });
//   } catch (error) {
//     console.error("Error in deleteComboOffer:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

// export const getComboById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const combo = await prisma.comboOffers.findUnique({
//       where: { id: id },
//     });

//     if (!combo) {
//       return res.status(404).json({ error: "Combo Offer not found" });
//     }
//     res.status(200).json(combo);
//   } catch (error) {
//     console.error("Error in getComboById:", error);
//     res.status(400).json({ error: error.message });
//   }
// };

import { PrismaClient } from "@prisma/client";
import { deleteFile, renameFileToMatchId } from "../utils/fileUtils.js";
import { calculateComboPrice } from "../utils/calculateComboPrice.js";

const prisma = new PrismaClient();

export const addComboOffer = async (req, res) => {
  let tempImageUrl = req.file?.filename || "dummy.png";

  try {
    // FIX: Change 'items' to 'comboItems' to match frontend
    const { name, description, discount, pizzas, comboItems, manualPrice } = req.body;

    // Validate required fields
    // FIX: Update condition to check for comboItems
    if (!name || !description || (!pizzas && !comboItems)) {
      if (req.file) deleteFile(tempImageUrl);
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Handle both old format (pizzas) and new format (comboItems)
    let comboItemsArray = [];
    
    if (comboItems) {
      // FIX: Use comboItems instead of items
      const parsedItems = typeof comboItems === "string" ? JSON.parse(comboItems) : comboItems;
      if (!Array.isArray(parsedItems)) {
        if (req.file) deleteFile(tempImageUrl);
        return res.status(400).json({ error: "ComboItems must be an array" });
      }
      comboItemsArray = parsedItems;
    } else if (pizzas) {
      // Backward compatibility with old pizza-only format
      const parsedPizzas = typeof pizzas === "string" ? JSON.parse(pizzas) : pizzas;
      if (!Array.isArray(parsedPizzas)) {
        if (req.file) deleteFile(tempImageUrl);
        return res.status(400).json({ error: "Pizzas must be an array" });
      }
      // Convert pizzas to new format
      comboItemsArray = parsedPizzas.map(pizza => ({
        ...pizza,
        itemType: 'PIZZA'
      }));
    }

    // Validate each item
    for (const item of comboItemsArray) {
      if (!item.quantity || item.quantity <= 0) {
        if (req.file) deleteFile(tempImageUrl);
        return res.status(400).json({
          error: "Each item must have a valid quantity",
        });
      }

      if (item.itemType === 'PIZZA') {
        if (!item.pizzaId || !item.size) {
          if (req.file) deleteFile(tempImageUrl);
          return res.status(400).json({
            error: "Pizza items must have pizzaId and size",
          });
        }
      } else if (item.itemType === 'OTHER_ITEM') {
        if (!item.otherItemId) {
          if (req.file) deleteFile(tempImageUrl);
          return res.status(400).json({
            error: "Other items must have otherItemId",
          });
        }
      } else {
        if (req.file) deleteFile(tempImageUrl);
        return res.status(400).json({
          error: "Each item must have a valid itemType (PIZZA or OTHER_ITEM)",
        });
      }
    }

    // Determine final price based on pricing mode
    let finalPrice;
    let finalDiscount = 0;

    if (manualPrice && Number(manualPrice) > 0) {
      // Manual pricing mode
      finalPrice = Number(manualPrice);
      finalDiscount = 0; // No discount when using manual pricing
    } else {
      // Percentage discount mode
      finalDiscount = Number(discount) || 0;
      // FIX: Pass comboItemsArray to calculateComboPrice
      finalPrice = await calculateComboPrice(comboItemsArray, finalDiscount);
    }

    const combo = await prisma.$transaction(async (tx) => {
      // Create the combo offer
      const newCombo = await tx.comboOffers.create({
        data: {
          name,
          description,
          discount: finalDiscount,
          price: finalPrice,
          imageUrl: tempImageUrl,
        },
      });

      // Rename uploaded file if not using dummy image
      if (tempImageUrl !== "dummy.png") {
        const newImageUrl = renameFileToMatchId(
          tempImageUrl,
          newCombo.id,
          "combo"
        );

        if (newImageUrl) {
          await tx.comboOffers.update({
            where: { id: newCombo.id },
            data: { imageUrl: newImageUrl },
          });
          newCombo.imageUrl = newImageUrl;
        }
      }

      // Create combo item relationships using new flexible model
      // FIX: Use comboItemsArray
      for (const item of comboItemsArray) {
        await tx.comboItem.create({
          data: {
            comboId: newCombo.id,
            pizzaId: item.itemType === 'PIZZA' ? item.pizzaId : null,
            otherItemId: item.itemType === 'OTHER_ITEM' ? item.otherItemId : null,
            quantity: Number(item.quantity),
            size: item.size || null,
            itemType: item.itemType,
          },
        });
      }

      // Also maintain backward compatibility with old ComboPizza model for pizzas
      const pizzaItems = comboItemsArray.filter(item => item.itemType === 'PIZZA');
      if (pizzaItems.length > 0) {
        await tx.comboPizza.createMany({
          data: pizzaItems.map((item) => ({
            comboId: newCombo.id,
            pizzaId: item.pizzaId,
            quantity: Number(item.quantity),
            size: item.size.toUpperCase(),
          })),
        });
      }

      return {
        ...newCombo,
        imageUrl: `/uploads/${newCombo.imageUrl}`,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Combo offer added successfully",
      data: combo,
    });
  } catch (error) {
    if (req.file) deleteFile(tempImageUrl);
    console.error("Error adding combo offer:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to add combo offer",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get Combo Offers
// export const getComboOffer = async (req, res) => {
//   try {
//     const combos = await prisma.comboOffers.findMany({
//       include: {
//         pizzas: {
//           include: {
//             pizza: true,
//           },
//         },
//         comboItems: {
//           include: {
//             pizza: true,
//             otherItem: true,
//           },
//         },
//       },
//     });

//     console.log("Fetched combos:", combos.pizzas);
//     console.log("Combo prices:", combos.map(combo => ({ name: combo.name, price: combo.price })));

//     const combosWithPrice = await Promise.all(
//       combos.map(async (combo) => {
//         let items = [];
//         let finalPrice = combo.price;

//         // Use new comboItems if available, fall back to old pizzas format
//         if (combo.comboItems && combo.comboItems.length > 0) {
//           // New format with mixed items
//           items = combo.comboItems.map((item) => ({
//             id: item.id,
//             itemType: item.itemType,
//             pizzaId: item.pizzaId,
//             otherItemId: item.otherItemId,
//             size: item.size,
//             quantity: item.quantity,
//             pizza: item.pizza,
//             otherItem: item.otherItem,
//           }));

//           // Recalculate price if using percentage discount
//           if (combo.discount > 0) {
//             try {
//               finalPrice = await calculateComboPrice(items, combo.discount);
//             } catch (error) {
//               console.error("Error recalculating combo price:", error);
//               finalPrice = combo.price; // Fall back to stored price
//             }
//           }
//         } else {
//           // Backward compatibility: convert old pizzas format
//           items = combo.pizzas.map((item) => ({
//             id: item.id,
//             itemType: 'PIZZA',
//             pizzaId: item.pizza.id,
//             otherItemId: null,
//             size: item.size,
//             quantity: item.quantity,
//             pizza: item.pizza,
//             otherItem: null,
//           }));

//           // Recalculate price for old format
//           if (combo.discount > 0) {
//             const pizzaItems = combo.pizzas.map((item) => ({
//               pizzaId: item.pizza.id,
//               size: item.size,
//               quantity: item.quantity,
//               itemType: 'PIZZA',
//             }));

//             try {
//               finalPrice = await calculateComboPrice(pizzaItems, combo.discount);
//             } catch (error) {
//               console.error("Error recalculating combo price:", error);
//               finalPrice = combo.price;
//             }
//           }
//         }

//         return {
//           ...combo,
//           items,
//           price: finalPrice,
//           imageUrl: `/uploads/${combo.imageUrl}`,
//         };
//       })
//     );

//     res.status(200).json(combosWithPrice);
//   } catch (error) {
//     console.error("Error in getComboOffer:", error);
//     res.status(400).json({ error: error.message });
//   }
// };
export const getComboOffer = async (req, res) => {
  try {
    const combos = await prisma.comboOffers.findMany({
      include: {
        pizzas: {
          include: {
            pizza: true,
          },
        },
        comboItems: {
          include: {
            pizza: true,
            otherItem: true,
          },
        },
      },
    });

    // Log pizza prices for debugging
    combos.forEach((combo, index) => {
      console.log(`\n=== Combo ${index + 1}: ${combo.name} ===`);
      combo.comboItems?.forEach(item => {
        if (item.itemType === 'PIZZA' && item.pizza) {
          const sizes = JSON.parse(item.pizza.sizes);
          const pizzaPrice = sizes[item.size];
          console.log(`Pizza: ${item.pizza.name} (${item.size}) - £${pizzaPrice}`);
        }
      });
    });

    const combosWithPrice = await Promise.all(
      combos.map(async (combo) => {
        let items = [];
        let finalPrice = combo.price;

        // Use new comboItems if available, fall back to old pizzas format
        if (combo.comboItems && combo.comboItems.length > 0) {
          // New format with mixed items - ADD CALCULATED PRICES
          items = combo.comboItems.map((item) => {
            let calculatedPrice = 0;
            
            if (item.itemType === 'PIZZA' && item.pizza) {
              const sizes = JSON.parse(item.pizza.sizes);
              calculatedPrice = sizes[item.size] * item.quantity;
            } else if (item.itemType === 'OTHER_ITEM' && item.otherItem) {
              calculatedPrice = parseFloat(item.otherItem.price) * item.quantity;
            }

            return {
              id: item.id,
              itemType: item.itemType,
              pizzaId: item.pizzaId,
              otherItemId: item.otherItemId,
              size: item.size,
              quantity: item.quantity,
              pizza: item.pizza,
              otherItem: item.otherItem,
              // ADD THESE NEW FIELDS:
              calculatedPrice: calculatedPrice,
              unitPrice: item.itemType === 'PIZZA' && item.pizza 
                ? JSON.parse(item.pizza.sizes)[item.size]
                : item.itemType === 'OTHER_ITEM' && item.otherItem
                ? parseFloat(item.otherItem.price)
                : 0
            };
          });

          // Recalculate price if using percentage discount
          if (combo.discount > 0) {
            try {
              finalPrice = await calculateComboPrice(items, combo.discount);
            } catch (error) {
              console.error("Error recalculating combo price:", error);
              finalPrice = combo.price; // Fall back to stored price
            }
          }
        } else {
          // Backward compatibility: convert old pizzas format - ADD CALCULATED PRICES
          items = combo.pizzas.map((item) => {
            const sizes = JSON.parse(item.pizza.sizes);
            const unitPrice = sizes[item.size];
            const calculatedPrice = unitPrice * item.quantity;

            return {
              id: item.id,
              itemType: 'PIZZA',
              pizzaId: item.pizza.id,
              otherItemId: null,
              size: item.size,
              quantity: item.quantity,
              pizza: item.pizza,
              otherItem: null,
              // ADD THESE NEW FIELDS:
              calculatedPrice: calculatedPrice,
              unitPrice: unitPrice
            };
          });

          // Recalculate price for old format
          if (combo.discount > 0) {
            const pizzaItems = combo.pizzas.map((item) => ({
              pizzaId: item.pizza.id,
              size: item.size,
              quantity: item.quantity,
              itemType: 'PIZZA',
            }));

            try {
              finalPrice = await calculateComboPrice(pizzaItems, combo.discount);
            } catch (error) {
              console.error("Error recalculating combo price:", error);
              finalPrice = combo.price;
            }
          }
        }

        return {
          ...combo,
          items,
          price: finalPrice,
          imageUrl: `/uploads/${combo.imageUrl}`,
        };
      })
    );

    res.status(200).json(combosWithPrice);
  } catch (error) {
    console.error("Error in getComboOffer:", error);
    res.status(400).json({ error: error.message });
  }
};

// Edit Combo Offer
export const editComboOffer = async (req, res) => {
  try {
    const { id } = req.body; // combo id
    const { name, description, discount, pizzas, comboItems, manualPrice } = req.body;
    const tempImageUrl = req.file ? req.file.filename : null;

    const existingCombo = await prisma.comboOffers.findUnique({
      where: { id: id },
    });

    if (!existingCombo) {
      if (req.file) deleteFile(req.file.filename);
      return res.status(404).json({ error: "Combo Offer not found" });
    }

    let items = [];
    
    // Handle new comboItems format
    if (comboItems) {
      const parsedComboItems = typeof comboItems === "string" ? JSON.parse(comboItems) : comboItems;
      if (!Array.isArray(parsedComboItems)) {
        return res.status(400).json({ error: "ComboItems must be an array" });
      }
      
      // Validate each combo item
      for (const item of parsedComboItems) {
        if (!item.quantity || !item.itemType) {
          return res.status(400).json({
            error: "Each combo item must have quantity and itemType",
          });
        }
        if (item.itemType === 'PIZZA' && (!item.pizzaId || !item.size)) {
          return res.status(400).json({
            error: "Pizza items must have pizzaId and size",
          });
        }
        if (item.itemType === 'OTHER_ITEM' && !item.otherItemId) {
          return res.status(400).json({
            error: "Other items must have otherItemId",
          });
        }
      }
      
      items = parsedComboItems;
    }
    // Handle legacy pizzas format for backward compatibility
    else if (pizzas) {
      const parsedPizzas = typeof pizzas === "string" ? JSON.parse(pizzas) : pizzas;
      if (!Array.isArray(parsedPizzas)) {
        return res.status(400).json({ error: "Pizzas must be an array" });
      }

      // Validate each pizza has required fields
      for (const pizza of parsedPizzas) {
        if (!pizza.pizzaId || !pizza.quantity || !pizza.size) {
          return res.status(400).json({
            error: "Each pizza must have pizzaId, quantity, and size",
          });
        }
      }
      
      // Convert legacy pizza format to new comboItems format
      items = parsedPizzas.map(pizza => ({
        pizzaId: pizza.pizzaId,
        quantity: pizza.quantity,
        size: pizza.size,
        itemType: 'PIZZA'
      }));
    } else {
      return res.status(400).json({ error: "Either comboItems or pizzas must be provided" });
    }

    // Determine final price based on pricing mode
    let finalPrice;
    let finalDiscount = 0;

    if (manualPrice && Number(manualPrice) > 0) {
      // Manual pricing mode
      finalPrice = Number(manualPrice);
      finalDiscount = 0; // No discount when using manual pricing
    } else {
      // Percentage discount mode
      finalDiscount = Number(discount) || 0;
      finalPrice = await calculateComboPrice(items, finalDiscount);
    }

    const updatedCombo = await prisma.$transaction(async (tx) => {
      // If a new image was uploaded, delete the old one
      if (tempImageUrl && existingCombo.imageUrl !== "dummy.png") {
        deleteFile(existingCombo.imageUrl);
      }

      // Update the combo with the new data
      const combo = await tx.comboOffers.update({
        where: { id: id },
        data: {
          name,
          description,
          discount: finalDiscount,
          price: finalPrice,
          imageUrl: tempImageUrl || existingCombo.imageUrl,
        },
      });

      // If a new image was uploaded, rename it to match the combo ID
      if (tempImageUrl) {
        const newImageUrl = renameFileToMatchId(
          tempImageUrl,
          combo.id,
          "combo"
        );

        // Update the combo with the new image URL if renaming was successful
        if (newImageUrl) {
          await tx.comboOffers.update({
            where: { id: combo.id },
            data: { imageUrl: newImageUrl },
          });
          combo.imageUrl = newImageUrl;
        }
      }

      // Delete existing combo relationships
      await tx.comboPizza.deleteMany({
        where: { comboId: id },
      });
      await tx.comboItem.deleteMany({
        where: { comboId: id },
      });

      // Create new combo items based on the new structure
      const comboItemsData = items.map((item) => ({
        comboId: id,
        pizzaId: item.itemType === 'PIZZA' ? item.pizzaId : null,
        otherItemId: item.itemType === 'OTHER_ITEM' ? item.otherItemId : null,
        quantity: item.quantity,
        size: item.size || null,
        itemType: item.itemType,
      }));

      await tx.comboItem.createMany({ data: comboItemsData });

      return {
        ...combo,
        imageUrl: `/uploads/${combo.imageUrl}`,
        comboItems: items,
      };
    });

    res.status(200).json({ message: "Combo Offer Updated", data: updatedCombo });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
    console.error("Error in editComboOffer:", error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteComboOffer = async (req, res) => {
  try {
    const { comboId } = req.body;

    if (!comboId) {
      return res.status(400).json({ error: "comboId is required" });
    }

    const existingCombo = await prisma.comboOffers.findUnique({
      where: { id: comboId },
    });

    if (!existingCombo) {
      return res.status(404).json({ error: "Combo Offer not found" });
    }

    // Delete the image file if it's not the default
    if (existingCombo.imageUrl !== "dummy.png") {
      deleteFile(existingCombo.imageUrl);
    }

    await prisma.$transaction(async (tx) => {
      await tx.comboPizza.deleteMany({
        where: { comboId },
      });

      await tx.comboOffers.delete({
        where: { id: comboId },
      });
    });

    res.status(200).json({ message: "Combo Offer Deleted" });
  } catch (error) {
    console.error("Error in deleteComboOffer:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getComboById = async (req, res) => {
  const { id } = req.params;
  try {
    const combo = await prisma.comboOffers.findUnique({
      where: { id: id },
    });

    if (!combo) {
      return res.status(404).json({ error: "Combo Offer not found" });
    }
    res.status(200).json(combo);
  } catch (error) {
    console.error("Error in getComboById:", error);
    res.status(400).json({ error: error.message });
  }
};