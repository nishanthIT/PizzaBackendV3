// import Stripe from "stripe";
// import { PrismaClient } from "@prisma/client"; // Add this import
// import { authenticateUser } from "../middleware/authMiddleware.js";
// import { createOrderFromCart } from "../services/orderService.js";

// // Initialize Prisma client
// const prisma = new PrismaClient(); // Add this line

// // Validate required environment variables
// if (!process.env.FRONTEND_URL) {
//   throw new Error("FRONTEND_URL environment variable is required");
// }

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error("STRIPE_SECRET_KEY environment variable is required");
// }

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export default async function checkout(req, res) {
//   try {
//     await new Promise((resolve, reject) => {
//       authenticateUser(req, res, (err) => {
//         if (err) return reject(err);
//         resolve();
//       });
//     });

//     const userId = req.user.id;

//     // Get user's active cart
//     const userCart = await prisma.cart.findFirst({
//       where: { userId },
//       include: {
//         cartItems: {
//           include: {
//             pizza: true,
//             combo: true,
//             otherItem: true, // Add this line
//             cartToppings: true,
//             cartIngredients: true,
//           },
//         },
//       },
//     });

//     if (!userCart) {
//       return res.status(400).json({ error: "No active cart found" });
//     }

//     console.log("User cart:", userCart);

//     const {
//       finalTotal,
//       shippingFee,
//       // deliveryFee = 1.5,
//       taxAmount,
//       deliveryMethod,
//       name,
//       address,
//       pickupTime,
//     } = req.body;

//     const deliveryFee = 1.5; // Fixed delivery fee
//     console.log("Delivery method:", deliveryMethod);

//     const final_total =
//       deliveryMethod == "delivery"
//         ? Number(userCart.totalAmount) + Number(deliveryFee)
//         : Number(userCart.totalAmount);

//     // Replace the existing line_items mapping with this:
//     const line_items = userCart.cartItems.map((item) => {
//       // Get the item name based on type
//       let itemName = "";
//       if (item.isCombo && item.combo) {
//         itemName = item.combo.name;
//       } else if (item.isOtherItem && item.otherItem) {
//         itemName = item.otherItem.name;
//       } else if (item.pizza) {
//         itemName = item.pizza.name;
//       } else {
//         itemName = "Unknown Item"; // Fallback name
//       }

//       return {
//         price_data: {
//           currency: "gbp",
//           product_data: {
//             name: itemName, // Now we ensure there's always a name
//             description: item.isCombo
//               ? "Combo Pack"
//               : item.isOtherItem
//               ? "Other Item"
//               : `Size: ${item.size}`,
//           },
//           unit_amount: Math.round(Number(item.basePrice) * 100),
//         },
//         quantity: item.quantity,
//       };
//     });

//     // Add fees
//     if (deliveryMethod === "delivery") {
//       line_items.push(
//         // {
//         //   price_data: {
//         //     currency: "gbp",
//         //     product_data: { name: "Shipping Fee" },
//         //     unit_amount: Math.round(shippingFee * 100),
//         //   },
//         //   quantity: 1,
//         // },
//         {
//           price_data: {
//             currency: "gbp",
//             product_data: { name: "Delivery Fee" },
//             unit_amount: Math.round(deliveryFee * 100),
//           },
//           quantity: 1,
//         }
//       );
//     }

//     // Add tax
//     // line_items.push({
//     //   price_data: {
//     //     currency: "gbp",
//     //     product_data: { name: "Tax" },
//     //     unit_amount: Math.round(taxAmount * 100),
//     //   },
//     //   quantity: 1,
//     // });

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "payment",
//       line_items,
//       success_url: `${process.env.FRONTEND_URL}/login?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONTEND_URL}/cart`,
//       metadata: {
//         userId,
//         cartId: userCart.id,
//         deliveryMethod,
//         name,
//         address: address || "",
//         pickupTime: pickupTime || "",
//         totalAmount: Number(final_total),

//         // totalAmount: finalTotal.toString(),
//         //totalAmount: pizza_Total.toString(),
//       },
//     });

//     res.json({ url: session.url });
//   } catch (err) {
//     console.error("Checkout Error:", err);
//     res.status(500).json({ error: "Checkout failed" });
//   }
// }

// // Add webhook handler for successful payments
// export async function handleStripeWebhook(req, res) {
//   try {
//     const sig = req.headers["stripe-signature"];
//     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
//     const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object;
//       const {
//         userId,
//         cartId,
//         deliveryMethod,
//         name,
//         address,
//         pickupTime,
//         totalAmount,
//       } = session.metadata;

//       // Check if order already exists for this payment
//       const existingOrder = await prisma.order.findFirst({
//         where: { paymentId: session.payment_intent },
//       });

//       if (existingOrder) {
//         console.log("Order already exists:", existingOrder.id);
//         return res.json({ received: true, orderId: existingOrder.id });
//       }

//       // Get cart with a transaction to ensure consistency
//       const result = await prisma.$transaction(async (tx) => {
//         // Get cart
//         const cart = await tx.cart.findUnique({
//           where: { id: cartId },
//           include: {
//             cartItems: {
//               include: {
//                 pizza: true,
//                 combo: true,
//                 otherItem: true,
//                 cartToppings: { include: { topping: true } },
//                 cartIngredients: { include: { ingredient: true } },
//               },
//             },
//           },
//         });

//         if (!cart) {
//           throw new Error("Cart not found");
//         }

//         // Create order
//         const order = await tx.order.create({
//           data: {
//             userId,
//             status: "PENDING",
//             totalAmount: new Decimal(totalAmount),
//             deliveryMethod,
//             deliveryAddress: address || null,
//             pickupTime: pickupTime || null,
//             customerName: name,
//             paymentStatus: "PAID",
//             paymentId: session.payment_intent,
//             orderItems: {
//               create: cart.cartItems.map((item) => {
//                 // Debug log to verify cart item data
//                 console.log("Processing cart item for order:", {
//                   id: item.id,
//                   isOtherItem: item.isOtherItem,
//                   otherItemId: item.otherItemId,
//                   isCombo: item.isCombo,
//                   comboId: item.comboId,
//                   pizzaId: item.pizzaId,
//                   size: item.size,
//                   finalPrice: item.finalPrice,
//                 });

//                 // Explicitly construct the order item
//                 const orderItem = {
//                   quantity: item.quantity,
//                   size: item.size,
//                   price: item.finalPrice,
//                   isCombo: Boolean(item.isCombo),
//                   isOtherItem: Boolean(item.isOtherItem),
//                   pizzaId: null,
//                   comboId: null,
//                   otherItemId: null,
//                 };

//                 // Important: Set IDs based on item type
//                 if (item.isOtherItem && item.otherItemId) {
//                   orderItem.otherItemId = item.otherItemId;
//                   orderItem.isOtherItem = true;
//                   // Reset other IDs
//                   orderItem.pizzaId = null;
//                   orderItem.comboId = null;
//                 } else if (item.isCombo && item.comboId) {
//                   orderItem.comboId = item.comboId;
//                   orderItem.isCombo = true;
//                   // Reset other IDs
//                   orderItem.pizzaId = null;
//                   orderItem.otherItemId = null;
//                 } else if (item.pizzaId) {
//                   orderItem.pizzaId = item.pizzaId;
//                   // Reset other IDs
//                   orderItem.comboId = null;
//                   orderItem.otherItemId = null;
//                 }

//                 // Add debug log for final order item
//                 console.log("Final order item to be created:", {
//                   ...orderItem,
//                   hasOtherItemId: Boolean(orderItem.otherItemId),
//                   hasComboId: Boolean(orderItem.comboId),
//                   hasPizzaId: Boolean(orderItem.pizzaId),
//                 });

//                 // Handle toppings and ingredients only for pizzas
//                 if (!orderItem.isOtherItem && !orderItem.isCombo) {
//                   orderItem.orderToppings = {
//                     create: item.cartToppings.map((t) => ({
//                       name: t.topping.name,
//                       price: t.topping.price,
//                       status: true,
//                       include: true,
//                       quantity: t.addedQuantity,
//                     })),
//                   };
//                   orderItem.orderIngredients = {
//                     create: item.cartIngredients.map((i) => ({
//                       name: i.ingredient.name,
//                       price: i.ingredient.price,
//                       status: true,
//                       include: true,
//                       quantity: i.addedQuantity,
//                     })),
//                   };
//                 } else {
//                   orderItem.orderToppings = { create: [] };
//                   orderItem.orderIngredients = { create: [] };
//                 }

//                 return orderItem;
//               }),
//             },
//           },
//           include: {
//             orderItems: {
//               include: {
//                 pizza: true,
//                 combo: true,
//                 otherItem: true,
//                 orderToppings: true,
//                 orderIngredients: true,
//               },
//             },
//           },
//         });

//         // Clear cart
//         await tx.cart.update({
//           where: { id: cartId },
//           data: {
//             cartItems: { deleteMany: {} },
//             totalAmount: 0,
//           },
//         });

//         return order;
//       });

//       console.log("✅ Order created successfully:", {
//         id: result.id,
//         items: result.orderItems.map((item) => ({
//           id: item.id,
//           isOtherItem: item.isOtherItem,
//           otherItemId: item.otherItemId,
//           size: item.size,
//           price: item.price,
//         })),
//       });

//       // After order creation, add this verification log
//       console.log(
//         "Order items created:",
//         result.orderItems.map((item) => ({
//           id: item.id,
//           isOtherItem: item.isOtherItem,
//           otherItemId: item.otherItemId,
//           size: item.size,
//           price: item.price,
//           cartItemId: item.cartItemId,
//           originalCartItem: cart.cartItems.find(
//             (ci) =>
//               ci.otherItemId === item.otherItemId ||
//               ci.comboId === item.comboId ||
//               ci.pizzaId === item.pizzaId
//           ),
//         }))
//       );

//       // Add after order creation
//       console.log(
//         "Verifying created order items:",
//         result.orderItems.map((item) => ({
//           id: item.id,
//           isOtherItem: item.isOtherItem,
//           otherItemId: item.otherItemId,
//           type: item.isOtherItem ? "OTHER" : item.isCombo ? "COMBO" : "PIZZA",
//           size: item.size,
//           price: item.price,
//         }))
//       );

//       // After order creation
//       console.log("Final order items verification:", {
//         orderItems: result.orderItems.map((item) => ({
//           id: item.id,
//           isOtherItem: item.isOtherItem,
//           otherItemId: item.otherItemId,
//           originalCartItem: cart.cartItems.find(
//             (ci) =>
//               ci.id === item.cartItemId || ci.otherItemId === item.otherItemId
//           ),
//           types: {
//             isOtherItemType: typeof item.isOtherItem,
//             otherItemIdType: typeof item.otherItemId,
//           },
//         })),
//       });

//       return res.json({ received: true, orderId: result.id });
//     }

//     return res.json({ received: true });
//   } catch (err) {
//     console.error("Webhook Error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }





import Stripe from "stripe";
import prisma from "../lib/prisma.js"; // Use singleton Prisma client
import { prismaWithRetry } from "../lib/dbRetry.js";
import jwt from "jsonwebtoken";
import { validateDeliveryPostcode } from '../services/postalCodeService.js';

// Validate required environment variables
if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL environment variable is required");
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-2024";

// USER AUTH MIDDLEWARE (Same as in server.js)
const verifyUserToken = (req, res, next) => {
  try {
    const userToken = req.cookies.userToken || req.cookies.authToken || req.cookies.token;
    
    if (!userToken) {
      console.log("❌ No user token found in cookies");
      return res.status(401).json({ error: "User not authenticated. Please verify OTP first." });
    }

    try {
      const decoded = jwt.verify(userToken, JWT_SECRET);
      req.user = decoded;
      
      console.log("✅ User authenticated:", {
        userId: decoded.userId,
        path: req.path
      });
      
      next();
    } catch (jwtError) {
      console.error("❌ JWT verification failed:", jwtError.message);
      return res.status(401).json({ error: "Invalid user token. Please verify OTP again." });
    }
  } catch (error) {
    console.error("❌ User auth middleware error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

export default async function checkout(req, res) {
  // Apply authentication middleware
  await new Promise((resolve, reject) => {
    verifyUserToken(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  try {
    const userId = req.user.userId; // Note: using userId from JWT token

    // Get user's active cart from database with retry logic
    const userCart = await prismaWithRetry(() => 
      prisma.cart.findFirst({
        where: { userId },
        include: {
          cartItems: {
            include: {
              pizza: true,
              combo: true,
              comboStyleItem: true, // Add combo style item relation
              otherItem: true,
              cartToppings: true,
              cartIngredients: true,
            },
          },
        },
      })
    );

    if (!userCart || userCart.cartItems.length === 0) {
      return res.status(400).json({ error: "No active cart found or cart is empty" });
    }

    console.log("User cart from database:", userCart);

    // Get request data (only non-sensitive data from frontend)
    const {
      deliveryMethod,
      name,
      address,
      postcode,
      pickupTime,
      orderTiming,
      preorderDate,
      preorderTime,
    } = req.body;

    // Validate postcode if delivery method is selected
    if (deliveryMethod === "delivery") {
      if (!postcode) {
        return res.status(400).json({ error: "Postcode is required for delivery orders" });
      }

      // Server-side postcode validation
      const postcodeValidation = await validateDeliveryPostcode(postcode);
      if (!postcodeValidation.isValid) {
        return res.status(400).json({ 
          error: `Invalid delivery area: ${postcodeValidation.error}`,
          details: postcodeValidation 
        });
      }
      
      console.log("✅ Postcode validation passed:", {
        postcode: postcodeValidation.postcode,
        distance: postcodeValidation.distance
      });
    }

    // SECURE: Calculate delivery fee on backend (not trusting frontend)
    const deliveryFee = 3.95; // Fixed delivery fee
    console.log("Delivery method:", deliveryMethod);

    // SECURE: Calculate final total from database cart
    const final_total =
      deliveryMethod === "delivery"
        ? Number(userCart.totalAmount) + Number(deliveryFee)
        : Number(userCart.totalAmount);

    // SECURE: Create line items from actual database cart
    const line_items = userCart.cartItems.map((item) => {
      // Get the item name based on type
      let itemName = "";
      if (item.isCombo && item.combo) {
        itemName = item.combo.name;
      } else if (item.isOtherItem && item.otherItem) {
        itemName = item.otherItem.name;
      } else if (item.pizza) {
        itemName = item.pizza.name;
      } else {
        itemName = "Unknown Item"; // Fallback name
      }

      return {
        price_data: {
          currency: "gbp",
          product_data: {
            name: itemName,
            description: item.isCombo
              ? "Combo Pack"
              : item.isOtherItem
              ? "Other Item"
              : `Size: ${item.size}`,
          },
          unit_amount: Math.round(Number(item.finalPrice) * 100), // Use finalPrice from database
        },
        quantity: item.quantity,
      };
    });

    // Add delivery fee if applicable
    if (deliveryMethod === "delivery") {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Delivery Fee" },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3001"}/login?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3001"}/checkout`,
      metadata: {
        userId,
        cartId: userCart.id,
        deliveryMethod,
        name,
        address: address || "",
        postcode: deliveryMethod === "delivery" ? postcode : "",
        pickupTime: pickupTime || "",
        totalAmount: Number(final_total).toString(),
        // Add timing fields
        orderTiming: orderTiming || "asap",
        preorderDate: preorderDate || "",
        preorderTime: preorderTime || "",
      },
    });

    console.log("✅ Secure checkout session created:", {
      sessionId: session.id,
      calculatedTotal: final_total,
      deliveryFee: deliveryFee,
      cartTotal: userCart.totalAmount,
      orderTiming: session.metadata.orderTiming
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).json({ error: "Checkout failed", details: err.message });
  }
}

// Add webhook handler for successful payments
export async function handleStripeWebhook(req, res) {
  try {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const {
        userId,
        cartId,
        deliveryMethod,
        name,
        address,
        pickupTime,
        totalAmount,
      } = session.metadata;

      // Check if order already exists for this payment
      const existingOrder = await prisma.order.findFirst({
        where: { paymentId: session.payment_intent },
      });

      if (existingOrder) {
        console.log("Order already exists:", existingOrder.id);
        return res.json({ received: true, orderId: existingOrder.id });
      }

      // Get cart with a transaction to ensure consistency
      const result = await prisma.$transaction(async (tx) => {
        // Get cart
        const cart = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            cartItems: {
              include: {
                pizza: true,
                combo: true,
                comboStyleItem: true, // Add combo style item relation
                otherItem: true,
                cartToppings: { include: { topping: true } },
                cartIngredients: { include: { ingredient: true } },
              },
            },
          },
        });

        if (!cart) {
          throw new Error("Cart not found");
        }

        // Create order
        const order = await tx.order.create({
          data: {
            userId,
            status: "PENDING",
            totalAmount: new Decimal(totalAmount),
            deliveryMethod,
            deliveryAddress: address || null,
            pickupTime: pickupTime || null,
            customerName: name,
            paymentStatus: "PAID",
            paymentId: session.payment_intent,
            orderItems: {
              create: cart.cartItems.map((item) => {
                // Debug log to verify cart item data
                console.log("Processing cart item for order:", {
                  id: item.id,
                  isOtherItem: item.isOtherItem,
                  otherItemId: item.otherItemId,
                  isCombo: item.isCombo,
                  comboId: item.comboId,
                  pizzaId: item.pizzaId,
                  comboStyleItemId: item.comboStyleItemId,
                  size: item.size,
                  finalPrice: item.finalPrice,
                  isMealDeal: item.isMealDeal,
                  selectedSides: item.selectedSides,
                  selectedDrinks: item.selectedDrinks,
                  sauce: item.sauce,
                });

                // Explicitly construct the order item
                const orderItem = {
                  quantity: item.quantity,
                  size: item.size,
                  price: item.finalPrice,
                  isCombo: Boolean(item.isCombo),
                  isOtherItem: Boolean(item.isOtherItem),
                  pizzaId: null,
                  comboId: null,
                  otherItemId: null,
                  comboStyleItemId: null, // Add combo style item ID
                  // Add combo style item specific fields
                  sauce: item.sauce || null,
                  // Handle selectedSides and selectedDrinks properly
                  selectedSides: item.selectedSides && item.selectedSides !== "[]" ? item.selectedSides : null,
                  selectedDrinks: item.selectedDrinks && item.selectedDrinks !== "[]" ? item.selectedDrinks : null,
                  isMealDeal: Boolean(item.isMealDeal),
                  pizzaBase: item.pizzaBase || null,
                };

                // Important: Set IDs based on item type
                if (item.comboStyleItemId) {
                  orderItem.comboStyleItemId = item.comboStyleItemId;
                  // Reset other IDs
                  orderItem.pizzaId = null;
                  orderItem.comboId = null;
                  orderItem.otherItemId = null;
                } else if (item.isOtherItem && item.otherItemId) {
                  orderItem.otherItemId = item.otherItemId;
                  orderItem.isOtherItem = true;
                  // Reset other IDs
                  orderItem.pizzaId = null;
                  orderItem.comboId = null;
                  orderItem.comboStyleItemId = null;
                } else if (item.isCombo && item.comboId) {
                  orderItem.comboId = item.comboId;
                  orderItem.isCombo = true;
                  // Reset other IDs
                  orderItem.pizzaId = null;
                  orderItem.otherItemId = null;
                  orderItem.comboStyleItemId = null;
                } else if (item.pizzaId) {
                  orderItem.pizzaId = item.pizzaId;
                  // Reset other IDs
                  orderItem.comboId = null;
                  orderItem.otherItemId = null;
                  orderItem.comboStyleItemId = null;
                }

                // Add debug log for final order item
                console.log("Final order item to be created:", {
                  ...orderItem,
                  hasOtherItemId: Boolean(orderItem.otherItemId),
                  hasComboId: Boolean(orderItem.comboId),
                  hasPizzaId: Boolean(orderItem.pizzaId),
                  hasComboStyleItemId: Boolean(orderItem.comboStyleItemId),
                  selectedSides: orderItem.selectedSides,
                  selectedDrinks: orderItem.selectedDrinks,
                  isMealDeal: orderItem.isMealDeal,
                });

                // Handle toppings and ingredients only for pizzas
                if (!orderItem.isOtherItem && !orderItem.isCombo && !orderItem.comboStyleItemId) {
                  orderItem.orderToppings = {
                    create: item.cartToppings.map((t) => ({
                      name: t.topping.name,
                      price: t.topping.price,
                      status: true,
                      include: true,
                      quantity: t.addedQuantity,
                    })),
                  };
                  orderItem.orderIngredients = {
                    create: item.cartIngredients.map((i) => ({
                      name: i.ingredient.name,
                      price: i.ingredient.price,
                      status: true,
                      include: true,
                      quantity: i.addedQuantity,
                    })),
                  };
                } else {
                  orderItem.orderToppings = { create: [] };
                  orderItem.orderIngredients = { create: [] };
                }

                return orderItem;
              }),
            },
          },
          include: {
            orderItems: {
              include: {
                pizza: true,
                combo: true,
                comboStyleItem: true, // Add combo style item relation
                otherItem: true,
                orderToppings: true,
                orderIngredients: true,
              },
            },
          },
        });

        // Clear cart
        await tx.cart.update({
          where: { id: cartId },
          data: {
            cartItems: { deleteMany: {} },
            totalAmount: 0,
          },
        });

        return order;
      });

      console.log("✅ Order created successfully:", {
        id: result.id,
        items: result.orderItems.map((item) => ({
          id: item.id,
          isOtherItem: item.isOtherItem,
          otherItemId: item.otherItemId,
          size: item.size,
          price: item.price,
        })),
      });

      // After order creation, add this verification log
      console.log(
        "Order items created:",
        result.orderItems.map((item) => ({
          id: item.id,
          isOtherItem: item.isOtherItem,
          otherItemId: item.otherItemId,
          size: item.size,
          price: item.price,
          cartItemId: item.cartItemId,
          originalCartItem: cart.cartItems.find(
            (ci) =>
              ci.otherItemId === item.otherItemId ||
              ci.comboId === item.comboId ||
              ci.pizzaId === item.pizzaId
          ),
        }))
      );

      // Add after order creation
      console.log(
        "Verifying created order items:",
        result.orderItems.map((item) => ({
          id: item.id,
          isOtherItem: item.isOtherItem,
          otherItemId: item.otherItemId,
          type: item.isOtherItem ? "OTHER" : item.isCombo ? "COMBO" : "PIZZA",
          size: item.size,
          price: item.price,
        }))
      );

      // After order creation
      console.log("Final order items verification:", {
        orderItems: result.orderItems.map((item) => ({
          id: item.id,
          isOtherItem: item.isOtherItem,
          otherItemId: item.otherItemId,
          originalCartItem: cart.cartItems.find(
            (ci) =>
              ci.id === item.cartItemId || ci.otherItemId === item.otherItemId
          ),
          types: {
            isOtherItemType: typeof item.isOtherItem,
            otherItemIdType: typeof item.otherItemId,
          },
        })),
      });

      return res.json({ received: true, orderId: result.id });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: err.message });
  }
}





