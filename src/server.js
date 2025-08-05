
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { fileURLToPath } from "url";
// import path from "path";
// import dotenv from "dotenv";
// import Stripe from "stripe";
// import { verifyToken } from "./adminController/auth.js";

// // Import routes
// import adminRoutes from "./routes/adminRoutes.js";
// import getPizzaRoutes from "./routes/getPizzaRoutes.js";
// import cartRoutes from "./routes/cartRoutes.js";

// dotenv.config();

// import { PrismaClient } from "@prisma/client"; // Add this import
// const prisma = new PrismaClient(); // Add this line

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 3003;

// console.log("hited the server")

// // app.post(
// //   "/webhook",
// //   express.raw({ type: "application/json" }),
// //   async (req, res) => {
// //     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // from Stripe dashboard
// //     const sig = req.headers["stripe-signature"];

// //     let event;

// //     try {
// //       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
// //     } catch (err) {
// //       return res.status(400).send(`Webhook Error: ${err.message}`);
// //     }

// //     if (event.type === "checkout.session.completed") {
// //       const session = event.data.object;

// //       // const metadata = session.metadata;

// //       // const order = {
// //       //   userId: metadata.userId,
// //       //   name: metadata.name,
// //       //   deliveryMethod: metadata.deliveryMethod,
// //       //   address: metadata.address,
// //       //   pickupTime: metadata.pickupTime,
// //       //   //items: JSON.parse(metadata.orderData),
// //       //   amountTotal: session.amount_total / 100, // in GBP
// //       //   paymentStatus: "paid",
// //       //   cartId : metadata.cartId,
// //       // };

// //       const {
// //         userId,
// //         cartId,
// //         deliveryMethod,
// //         name,
// //         address,
// //         pickupTime,
// //         totalAmount,
// //       } = session.metadata;

// //       console.log(totalAmount);

// //       const cart = await prisma.cart.findUnique({
// //         where: { id: cartId },
// //         include: {
// //           cartItems: {
// //             include: {
// //               pizza: true,
// //               combo: true,
// //               otherItem: true, // Add this
// //               cartToppings: {
// //                 include: { topping: true },
// //               },
// //               cartIngredients: {
// //                 include: { ingredient: true },
// //               },
// //             },
// //           },
// //         },
// //       });
// //       console.log("Cart found:", cart);

// //       if (!cart) {
// //         throw new Error("Cart not found");
// //       }
// //       // Update the order creation query to include orderItems
// //       const order = await prisma.order.create({
// //         data: {
// //           userId: userId,
// //           status: "PENDING",
// //           totalAmount,
// //           deliveryMethod: deliveryMethod,
// //           deliveryAddress: address || null,
// //           pickupTime: pickupTime || null,
// //           customerName: name,
// //           paymentStatus: "PAID",
// //           paymentId: session.payment_intent,
// //           orderItems: {
// //             create: cart.cartItems.map((item) => {
// //               console.log("Creating order item:", {
// //                 id: item.id,
// //                 isOtherItem: item.isOtherItem,
// //                 otherItemId: item.otherItemId,
// //               });

// //               return {
// //                 pizzaId: item.isOtherItem ? null : item.pizzaId,
// //                 comboId: item.isCombo ? item.comboId : null,
// //                 otherItemId: item.otherItemId,
// //                 quantity: item.quantity,
// //                 size: item.size,
// //                 price: item.finalPrice,
// //                 isCombo: Boolean(item.isCombo),
// //                 isOtherItem: Boolean(item.isOtherItem),
// //                 orderToppings: {
// //                   create:
// //                     !item.isOtherItem && !item.isCombo
// //                       ? item.cartToppings.map((t) => ({
// //                         name: t.topping.name,
// //                         price: t.topping.price,
// //                         status: true,
// //                         include: true,
// //                         quantity: t.addedQuantity,
// //                       }))
// //                       : [],
// //                 },
// //                 orderIngredients: {
// //                   create:
// //                     !item.isOtherItem && !item.isCombo
// //                       ? item.cartIngredients.map((i) => ({
// //                         name: i.ingredient.name,
// //                         price: i.ingredient.price,
// //                         status: true,
// //                         include: true,
// //                         quantity: i.addedQuantity,
// //                       }))
// //                       : [],
// //                 },
// //               };
// //             }),
// //           },
// //         },
// //         // Add this include block
// //         include: {
// //           orderItems: {
// //             include: {
// //               pizza: true,
// //               combo: true,
// //               otherItem: true,
// //               orderToppings: true,
// //               orderIngredients: true,
// //             },
// //           },
// //         },
// //       });
// //       console.log("Order created:", order);
// //       // Clear the cart
// //       await prisma.cart.update({
// //         where: { id: cartId },
// //         data: {
// //           cartItems: { deleteMany: {} },
// //           totalAmount: 0,
// //         },
// //       });

// //       // Save order to DB
// //       console.log("✅ New order:", order);

// //       // After order creation
// //       // Add null check before mapping
// //       console.log(
// //         "Order created with items:",
// //         order.orderItems?.map((item) => ({
// //           id: item.id,
// //           isOtherItem: item.isOtherItem,
// //           otherItemId: item.otherItemId,
// //           size: item.size,
// //           price: item.price,
// //         })) || []
// //       );
// //     }

// //     //res.send();
// //     res.json({ received: true });
// //   }
// // );



// // const corsOptions = {
// //   origin: ["https://circlepizzapizza.co.uk/", "https://vino.circlepizzapizza.co.uk/"],
// //   credentials: true,
// //   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// //   allowedHeaders: ["Content-Type", "Authorization"],
// // };

// // app.use(cors(corsOptions));







// // ...existing code...

// app.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
//     const sig = req.headers["stripe-signature"];

//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

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
//         orderTiming,
//         preorderDate,
//         preorderTime,
//       } = session.metadata;

//       console.log(totalAmount);

//       const cart = await prisma.cart.findUnique({
//         where: { id: cartId },
//         include: {
//           cartItems: {
//             include: {
//               pizza: true,
//               combo: true,
//               otherItem: true,
//               cartToppings: {
//                 include: { topping: true },
//               },
//               cartIngredients: {
//                 include: { ingredient: true },
//               },
//             },
//           },
//         },
//       });
//       console.log("Cart found:", cart);

//       if (!cart) {
//         throw new Error("Cart not found");
//       }

//       // Updated order creation with new timing fields
//       const order = await prisma.order.create({
//         data: {
//           userId: userId,
//           status: "PENDING",
//           totalAmount,
//           deliveryMethod: deliveryMethod,
//           deliveryAddress: address || null,
//           pickupTime: pickupTime || null,
//           customerName: name,
//           paymentStatus: "PAID",
//           paymentId: session.payment_intent,

//           // NEW: Add timing fields
//           orderTiming: orderTiming || "asap",
//           preorderDate: preorderDate || null,
//           preorderTime: preorderTime || null,

//           orderItems: {
//             create: cart.cartItems.map((item) => {
//               console.log("Creating order item:", {
//                 id: item.id,
//                 isOtherItem: item.isOtherItem,
//                 otherItemId: item.otherItemId,
//               });

//               return {
//                 pizzaId: item.isOtherItem ? null : item.pizzaId,
//                 comboId: item.isCombo ? item.comboId : null,
//                 otherItemId: item.otherItemId,
//                 quantity: item.quantity,
//                 size: item.size,
//                 price: item.finalPrice,
//                 isCombo: Boolean(item.isCombo),
//                 isOtherItem: Boolean(item.isOtherItem),
//                 orderToppings: {
//                   create:
//                     !item.isOtherItem && !item.isCombo
//                       ? item.cartToppings.map((t) => ({
//                         name: t.topping.name,
//                         price: t.topping.price,
//                         status: true,
//                         include: true,
//                         quantity: t.addedQuantity,
//                       }))
//                       : [],
//                 },
//                 orderIngredients: {
//                   create:
//                     !item.isOtherItem && !item.isCombo
//                       ? item.cartIngredients.map((i) => ({
//                         name: i.ingredient.name,
//                         price: i.ingredient.price,
//                         status: true,
//                         include: true,
//                         quantity: i.addedQuantity,
//                       }))
//                       : [],
//                 },
//               };
//             }),
//           },
//         },
//         include: {
//           orderItems: {
//             include: {
//               pizza: true,
//               combo: true,
//               otherItem: true,
//               orderToppings: true,
//               orderIngredients: true,
//             },
//           },
//         },
//       });
//       console.log("Order created:", order);

//       await prisma.cart.update({
//         where: { id: cartId },
//         data: {
//           cartItems: { deleteMany: {} },
//           totalAmount: 0,
//         },
//       });

//       console.log("✅ New order:", order);

//       console.log(
//         "Order created with items:",
//         order.orderItems?.map((item) => ({
//           id: item.id,
//           isOtherItem: item.isOtherItem,
//           otherItemId: item.otherItemId,
//           size: item.size,
//           price: item.price,
//         })) || []
//       );
//     }

//     res.json({ received: true });
//   }
// );











// const corsOptions = {
//   origin: ["https://vino.circlepizzapizza.co.uk", "https://circlepizzapizza.co.uk","http://localhost:8080","http://localhost:3001"],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));
// app.use((req, res, next) => {
//   console.log("🔥 Incoming request:", req.method, req.originalUrl, "Origin:", req.headers.origin);
//   next();
// });
// app.options("*", cors(corsOptions));

// app.use(cookieParser());
// app.use(express.urlencoded({ extended: true })); // For form POSTs
// app.use(express.json());

// // Add headers middleware
// // app.use((req, res, next) => {
// //   res.header("Access-Control-Allow-Credentials", "true");
// //   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
// //   next();
// // });

// // Serve static files
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// // Public routes
// app.use("/api", getPizzaRoutes);
// app.use("/api", cartRoutes);

// // Admin routes with authentication
// app.use("/api/admin", verifyToken); // Apply auth middleware only to /api/admin/* routes
// app.use("/api", adminRoutes);

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });









// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { fileURLToPath } from "url";
// import path from "path";
// import dotenv from "dotenv";
// import Stripe from "stripe";
// import { verifyToken } from "./adminController/auth.js";

// // Import routes
// import adminRoutes from "./routes/adminRoutes.js";
// import getPizzaRoutes from "./routes/getPizzaRoutes.js";
// import cartRoutes from "./routes/cartRoutes.js";

// dotenv.config();

// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 3003;

// console.log("hited the server")

// // CORS options
// const corsOptions = {
//   origin: ["https://vino.circlepizzapizza.co.uk", "https://circlepizzapizza.co.uk","http://localhost:8080","http://localhost:3001"],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));
// app.use((req, res, next) => {
//   console.log("🔥 Incoming request:", req.method, req.originalUrl, "Origin:", req.headers.origin);
//   next();
// });
// app.options("*", cors(corsOptions));

// // IMPORTANT: Webhook MUST come before express.json() middleware
// app.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
//     const sig = req.headers["stripe-signature"];

//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//       console.error("❌ Webhook signature verification failed:", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

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
//         orderTiming,     // Add this
//         preorderDate,    // Add this
//         preorderTime,    // Add this
//       } = session.metadata;

//       console.log("🎯 Webhook received timing data:", {
//         orderTiming,
//         preorderDate,
//         preorderTime,
//         totalAmount
//       });

//       try {
//         const cart = await prisma.cart.findUnique({
//           where: { id: cartId },
//           include: {
//             cartItems: {
//               include: {
//                 pizza: true,
//                 combo: true,
//                 otherItem: true,
//                 cartToppings: {
//                   include: { topping: true },
//                 },
//                 cartIngredients: {
//                   include: { ingredient: true },
//                 },
//               },
//             },
//           },
//         });

//         if (!cart) {
//           throw new Error("Cart not found");
//         }

//         // Create order with timing fields
//         const order = await prisma.order.create({
//           data: {
//             userId: userId,
//             status: "PENDING",
//             totalAmount: parseFloat(totalAmount),
//             deliveryMethod: deliveryMethod,
//             deliveryAddress: address || null,
//             pickupTime: pickupTime || null,
//             customerName: name,
//             paymentStatus: "PAID",
//             paymentId: session.payment_intent,

//             // Add timing fields
//             orderTiming: orderTiming || "asap",
//             preorderDate: preorderDate || null,
//             preorderTime: preorderTime || null,

//             orderItems: {
//               create: cart.cartItems.map((item) => ({
//                 pizzaId: item.isOtherItem ? null : item.pizzaId,
//                 comboId: item.isCombo ? item.comboId : null,
//                 otherItemId: item.otherItemId,
//                 quantity: item.quantity,
//                 size: item.size,
//                 price: item.finalPrice,
//                 isCombo: Boolean(item.isCombo),
//                 isOtherItem: Boolean(item.isOtherItem),
//                 orderToppings: {
//                   create:
//                     !item.isOtherItem && !item.isCombo
//                       ? item.cartToppings.map((t) => ({
//                         name: t.topping.name,
//                         price: t.topping.price,
//                         status: true,
//                         include: true,
//                         quantity: t.addedQuantity,
//                       }))
//                       : [],
//                 },
//                 orderIngredients: {
//                   create:
//                     !item.isOtherItem && !item.isCombo
//                       ? item.cartIngredients.map((i) => ({
//                         name: i.ingredient.name,
//                         price: i.ingredient.price,
//                         status: true,
//                         include: true,
//                         quantity: i.addedQuantity,
//                       }))
//                       : [],
//                 },
//               })),
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

//         console.log("✅ Order created with timing:", {
//           id: order.id,
//           orderTiming: order.orderTiming,
//           preorderDate: order.preorderDate,
//           preorderTime: order.preorderTime
//         });

//         // Clear the cart
//         await prisma.cart.update({
//           where: { id: cartId },
//           data: {
//             cartItems: { deleteMany: {} },
//             totalAmount: 0,
//           },
//         });

//       } catch (error) {
//         console.error("❌ Error processing webhook:", error);
//         return res.status(500).send("Error processing order");
//       }
//     }

//     res.json({ received: true });
//   }
// );

// // Regular middleware (AFTER webhook)
// app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // ADD: Create checkout session endpoint
// app.post("/api/create-checkout-session", verifyToken,async (req, res) => {
//   try {
//     const {
//       cartItems,
//       finalTotal,
//       deliveryFee,
//       taxAmount,
//       deliveryMethod,
//       name,
//       address,
//       pickupTime,
//       orderTiming,     // Add this
//       preorderDate,    // Add this
//       preorderTime,    // Add this
//     } = req.body;

//     // Debug log
//     console.log("🎯 Checkout session timing data:", {
//       orderTiming,
//       preorderDate,
//       preorderTime,
//       deliveryMethod,
//       name
//     });

//     // Get authenticated user (assuming you have auth middleware)
//     const user = req.user;
//     if (!user) {
//       return res.status(401).json({ error: "User not authenticated" });
//     }

//     // Get or create cart for the user
//     let cart = await prisma.cart.findFirst({
//       where: { userId: user.id }
//     });

//     if (!cart) {
//       cart = await prisma.cart.create({
//         data: { userId: user.id, totalAmount: 0 }
//       });
//     }

//     // Create Stripe checkout session
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "gbp",
//             product_data: {
//               name: "Food Order",
//               description: `${cartItems.length} items - ${deliveryMethod === "delivery" ? "Delivery" : "Pickup"}`,
//             },
//             unit_amount: Math.round(finalTotal * 100), // Convert to pence
//           },
//           quantity: 1,
//         },
//       ],
//       mode: "payment",
//       success_url: `${process.env.CLIENT_URL || "http://localhost:3001"}/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.CLIENT_URL || "http://localhost:3001"}/checkout`,
//       metadata: {
//         userId: user.id,
//         cartId: cart.id,
//         deliveryMethod,
//         name,
//         address: address || "",
//         pickupTime: pickupTime || "",
//         totalAmount: finalTotal.toString(),
//         // Add timing fields to metadata
//         orderTiming: orderTiming || "asap",
//         preorderDate: preorderDate || "",
//         preorderTime: preorderTime || "",
//       },
//     });

//     console.log("✅ Stripe session created with metadata:", {
//       orderTiming: session.metadata.orderTiming,
//       preorderDate: session.metadata.preorderDate,
//       preorderTime: session.metadata.preorderTime
//     });

//     res.json({ url: session.url });
//   } catch (error) {
//     console.error("❌ Error creating checkout session:", error);
//     res.status(500).json({ error: "Failed to create checkout session" });
//   }
// });

// // Serve static files
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// // Public routes
// app.use("/api", getPizzaRoutes);
// app.use("/api", cartRoutes);

// // Admin routes with authentication
// app.use("/api/admin", verifyToken);
// app.use("/api", adminRoutes);

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { verifyToken } from "./adminController/auth.js";

// Import routes
import adminRoutes from "./routes/adminRoutes.js";
import getPizzaRoutes from "./routes/getPizzaRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkout from "./checkoutControler/checkout.js";

dotenv.config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-2024";

// Twilio setup for notifications
let twilioClient = null;
let twilioPhone = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    console.log("✅ Twilio client initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Twilio client:", error);
  }
} else {
  console.warn("⚠️ Twilio environment variables not set. SMS/Call notifications will be disabled.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

console.log("hited the server")

// CORS options
const corsOptions = {
  origin: [`${process.env.FRONTEND}`, `${process.env.BACKEND_NAME}`, `${process.env.FRONTEND_WWW}`],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  console.log("🔥 Incoming request:", req.method, req.originalUrl, "Origin:", req.headers.origin);
  next();
});
app.options("*", cors(corsOptions));

// WEBHOOK MUST come before express.json() middleware
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Update the webhook section to add reward points
    // ...existing code...

    if (event.type === "checkout.session.completed") {
      console.log("🎯 Processing checkout.session.completed event");

      const session = event.data.object;

      const {
        userId,
        cartId,
        deliveryMethod,
        name,
        address,
        pickupTime,
        totalAmount,
        orderTiming,
        preorderDate,
        preorderTime,
      } = session.metadata;

      try {
        // Fetch cart with all related data
        const cart = await prisma.cart.findUnique({
          where: { id: cartId },
          include: {
            user: true, // Include user data for phone number
            cartItems: {
              include: {
                pizza: true,
                combo: true,
                otherItem: true,
                cartToppings: {
                  include: { topping: true },
                },
                cartIngredients: {
                  include: { ingredient: true },
                },
              },
            },
          },
        });

        console.log("Cart found:", cart);

        if (!cart) {
          throw new Error("Cart not found");
        }

        // Create order
        const order = await prisma.order.create({
          data: {
            userId: userId,
            status: "PENDING",
            totalAmount: parseFloat(totalAmount),
            deliveryMethod: deliveryMethod,
            deliveryAddress: address || null,
            pickupTime: pickupTime || null,
            customerName: name,
            paymentStatus: "PAID",
            paymentId: session.payment_intent,
            orderTiming: orderTiming || "asap",
            preorderDate: preorderDate || null,
            preorderTime: preorderTime || null,
            orderItems: {
              create: cart.cartItems.map((item) => ({
                pizzaId: item.isOtherItem ? null : item.pizzaId,
                comboId: item.isCombo ? item.comboId : null,
                otherItemId: item.otherItemId,
                quantity: item.quantity,
                size: item.size,
                price: item.finalPrice,
                pizzaBase: item.pizzaBase || null, // Add pizzaBase field from cart item
                isCombo: Boolean(item.isCombo),
                isOtherItem: Boolean(item.isOtherItem),
                orderToppings: {
                  create: !item.isOtherItem && !item.isCombo
                    ? item.cartToppings.map((t) => ({
                      name: t.topping.name,
                      price: t.topping.price,
                      status: true,
                      include: true,
                      quantity: t.addedQuantity,
                    }))
                    : [],
                },
                orderIngredients: {
                  create: !item.isOtherItem && !item.isCombo
                    ? item.cartIngredients.map((i) => ({
                      name: i.ingredient.name,
                      price: i.ingredient.price,
                      status: true,
                      include: true,
                      quantity: i.addedQuantity,
                    }))
                    : [],
                },
              })),
            },
          },
        });

        // ADD REWARD POINTS - 20% of total amount
        const rewardPoints = Math.floor(parseFloat(totalAmount) * 0.10);

        await prisma.user.update({
          where: { id: userId },
          data: {
            points: {
              increment: rewardPoints
            }
          }
        });

        console.log(`✅ Order created and ${rewardPoints} reward points added to user ${userId}`);

        // NOTIFICATION TO SHOP OWNER
        if (twilioClient && twilioPhone) {
          try {
            console.log("🔔 Attempting to send notifications to shop owner...");

            // Format order details with all items for SMS
            const formatOrderItems = () => {
              return cart.cartItems.map((item, index) => {
                let itemName = '';
                let itemDetails = '';

                if (item.isOtherItem && item.otherItem) {
                  itemName = item.otherItem.name;
                  itemDetails = `${item.quantity}x ${itemName} - £${parseFloat(item.finalPrice).toFixed(2)}`;
                } else if (item.isCombo && item.combo) {
                  itemName = item.combo.name;
                  itemDetails = `${item.quantity}x ${itemName} (${item.size}) - £${parseFloat(item.finalPrice).toFixed(2)}`;
                } else if (item.pizza) {
                  itemName = item.pizza.name;
                  const baseInfo = item.pizzaBase ? ` | Base: ${item.pizzaBase}` : '';

                  // Filter toppings to only show those with quantity > 0
                  const activeToppings = item.cartToppings.filter(t => t.addedQuantity > 0);
                  const activeIngredients = item.cartIngredients.filter(i => i.addedQuantity > 0);

                  let modificationsInfo = '';
                  if (activeToppings.length > 0 || activeIngredients.length > 0) {
                    const toppingsText = activeToppings.map(t => `${t.topping.name}(${t.addedQuantity})`).join(', ');
                    const ingredientsText = activeIngredients.map(i => `${i.ingredient.name}(${i.addedQuantity})`).join(', ');

                    const allModifications = [toppingsText, ingredientsText].filter(text => text.length > 0).join(', ');
                    if (allModifications) {
                      modificationsInfo = ` | +${allModifications}`;
                    }
                  }

                  itemDetails = `${item.quantity}x ${itemName} (${item.size})${baseInfo}${modificationsInfo} - £${parseFloat(item.finalPrice).toFixed(2)}`;
                }

                return `${index + 1}. ${itemDetails}`;
              }).join('\n');
            };

            const orderDetailsText = `
🍕 NEW ORDER RECEIVED! 🍕

Order ID: ${order.id}
Customer: ${name}
Phone: ${cart.user?.phone || 'N/A'}
Method: ${deliveryMethod.toUpperCase()}
${deliveryMethod === 'delivery' ? `Address: ${address}` : 'PICKUP ORDER'}
${orderTiming === 'preorder' ? `Scheduled: ${preorderDate} at ${preorderTime}` : 'ASAP ORDER'}

ORDER ITEMS:
${formatOrderItems()}

Total: £${parseFloat(totalAmount).toFixed(2)}
Payment: PAID ✅
Status: PENDING

Please prepare this order!
        `.trim();

            // Shop owner's phone number (add this to your .env file)
            const shopOwnerPhone = process.env.SHOP_OWNER_PHONE || '+447000000000';

            console.log(`📱 Sending SMS to: ${shopOwnerPhone}`);
            console.log(`📞 From: ${twilioPhone}`);

            // Send SMS notification to shop owner
            const smsMessage = await twilioClient.messages.create({
              body: orderDetailsText,
              from: twilioPhone,
              to: shopOwnerPhone
            });

            console.log(`📱 SMS sent to shop owner successfully! SID: ${smsMessage.sid}`);

            // Make a call to shop owner with order summary
            const callMessage = `Hello! You have a new order from ${name}. The order method is ${deliveryMethod} and the total amount is ${totalAmount} pounds. Please check your SMS for complete details. Thank you!`;

            console.log(`📞 Making call to shop owner...`);

            const call = await twilioClient.calls.create({
              twiml: `<Response><Say voice="alice">${callMessage}</Say></Response>`,
              from: twilioPhone,
              to: shopOwnerPhone
            });

            console.log(`📞 Call made to shop owner successfully! SID: ${call.sid}`);

          } catch (notificationError) {
            console.error("❌ Error sending notifications to shop owner:", {
              error: notificationError.message,
              code: notificationError.code,
              moreInfo: notificationError.moreInfo
            });
            // Don't fail the order if notification fails
          }
        } else {
          console.warn("⚠️ Twilio not configured. Skipping SMS/Call notifications.");
        }

        // Clear the cart
        await prisma.cart.update({
          where: { id: cartId },
          data: {
            cartItems: { deleteMany: {} },
            totalAmount: 0,
          },
        });

      } catch (error) {
        console.error("❌ Error processing webhook:", error);
        return res.status(500).send(`Error processing order: ${error.message}`);
      }
    }
    // ...existing code...

    res.json({ received: true });
  }
);

// Regular middleware (AFTER webhook)
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// USER AUTH MIDDLEWARE (Different from admin auth)
const verifyUserToken = (req, res, next) => {
  try {
    // Look for user token (not admin token)
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

// SECURE CHECKOUT SESSION - Use secure checkout controller
app.post("/api/create-checkout-session", checkout);

// Get user's meals donated based on total spending (10 pounds = 1 meal)
app.get("/api/user/meals-donated", verifyUserToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's total spending from all paid orders
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        paymentStatus: "PAID"
      },
      select: {
        totalAmount: true
      }
    });

    // Calculate total money spent
    const totalSpent = orders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount);
    }, 0);

    // Calculate meals donated (10 pounds = 1 meal, only full meals count)
    const mealsDonatted = Math.floor(totalSpent / 10);

    // Convert to decimal for display (e.g., 15 pounds = 1.5 displayed, but only 1 meal donated)
    const spendingProgress = totalSpent / 10;

    console.log(`User ${userId} - Total spent: £${totalSpent}, Meals donated: ${mealsDonatted}, Progress: ${spendingProgress.toFixed(1)}`);

    res.json({
      success: true,
      data: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        mealsDonatted: mealsDonatted,
        spendingProgress: parseFloat(spendingProgress.toFixed(1)),
        nextMealAt: parseFloat(((mealsDonatted + 1) * 10).toFixed(2))
      }
    });

  } catch (error) {
    console.error("❌ Error fetching meals donated:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch meals donated data",
      details: error.message
    });
  }
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Public routes
app.use("/api", getPizzaRoutes);
app.use("/api", cartRoutes);

// Admin routes with ADMIN authentication
app.use("/api/admin", verifyToken); // This uses admin auth
app.use("/api", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
