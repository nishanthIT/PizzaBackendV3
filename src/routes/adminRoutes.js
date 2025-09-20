import express from "express";
import {
  addTopping,
  deleteTopping,
  getToppings,
  updateStatusinTopping,
  updateTopping,
} from "../adminController/toppings.js";
import {
  addIngredient,
  deleteIngredient,
  getIngredients,
  updateIngredient,
  updateStatusinIngredient,
} from "../adminController/ingredients.js";
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../adminController/category.js";
import {
  addPizza,
  deletePizza,
  getAllPizzas,
  updatePizza,
} from "../adminController/pizzaController.js";
import {
  addComboOffer,
  deleteComboOffer,
  editComboOffer,
  getComboOffer,
} from "../adminController/comboOffers.js";
import serveImmg from "../consumerController/imageController.js";
import { convertToPng, upload } from "../middleware/upload.js";
import {
  changeOrderStatus,
  getAllOrders,
  getOrderDetails,
} from "../adminController/order.js";
import { login, verifyToken } from "../adminController/auth.js";
import {
  addOtherItem,
  deleteOtherItem,
  getAllOtherItems,
  updateOtherItem,
} from "../adminController/otherItems.js";
// Removed peri-peri imports - now using combo style items
import {
  getAllComboStyleItems,
  getComboStyleItemById,
  createComboStyleItem,
  updateComboStyleItem,
  deleteComboStyleItem,
  getAvailableSauces,
  getAvailableSides,
  getAvailableDrinks
} from "../adminController/comboStyleItems.js";
import {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} from "../adminController/customers.js";

import {
  getDashboardStats,
  getRevenueData,
  getRecentOrdersForDashboard,
  getMonthlyRevenue,
  getTopSellingItems,
  getOrderStatusDistribution
} from "../adminController/dashboard.js";


const router = express.Router();

// Public routes (no auth required)
router.get("/images/:imageName", serveImmg);
router.post("/login", login); // Changed back to /admin/login

// Protected routes with middleware
router.use("/admin", verifyToken); // Apply middleware to all admin routes
const adminRouter = express.Router();


router.get("/admin/dashboard/stats", getDashboardStats);
router.get("/admin/dashboard/revenue", getRevenueData);
router.get("/admin/dashboard/recent-orders", getRecentOrdersForDashboard);
router.get("/admin/dashboard/monthly-revenue", getMonthlyRevenue);
router.get("/admin/dashboard/top-items", getTopSellingItems);
router.get("/admin/dashboard/order-status", getOrderStatusDistribution);


// Admin routes (protected routes)
adminRouter.post("/addTopping", addTopping);
adminRouter.put("/updateTopping", updateTopping);
adminRouter.put("/updateStatusTopping", updateStatusinTopping);
adminRouter.delete("/deleteTopping", deleteTopping);
adminRouter.get("/getToppings", getToppings);

// Admin ingredients
adminRouter.post("/addIngredient", addIngredient);
adminRouter.put("/updateIngredient", updateIngredient);
adminRouter.put("/updateStatusIngredient", updateStatusinIngredient);
adminRouter.delete("/deleteIngredient", deleteIngredient);
adminRouter.get("/getIngredients", getIngredients);

// Admin category
adminRouter.post("/addCategory", addCategory);
adminRouter.put("/updateCategory", updateCategory);
adminRouter.delete("/deleteCategory", deleteCategory);
adminRouter.get("/getCategories", getCategories);

//custmers
adminRouter.get("/customers", getAllCustomers);
adminRouter.get("/customers/stats", getCustomerStats);
adminRouter.get("/customers/:id", getCustomerById);
adminRouter.put("/customers/:id", updateCustomer);
adminRouter.delete("/customers/:id", deleteCustomer);


// Admin pizza
adminRouter.post("/addPizza", upload.single("image"), convertToPng, addPizza);
adminRouter.put(
  "/updatePizza",
  upload.single("image"),
  convertToPng,
  updatePizza
);
adminRouter.delete("/deletePizza", deletePizza);
adminRouter.get("/getAllPizzas", getAllPizzas);

// Admin combo
adminRouter.post(
  "/addComboOffer",
  upload.single("image"),
  convertToPng,
  addComboOffer
);
adminRouter.get("/getComboOffer", getComboOffer);
adminRouter.delete("/deleteComboOffer", deleteComboOffer);
adminRouter.put(
  "/editComboOffer",
  upload.single("image"),
  convertToPng,
  editComboOffer
);

// add otherItems
adminRouter.post(
  "/addOtherItem",
  upload.single("image"),
  convertToPng,
  addOtherItem
);
adminRouter.put(
  "/updateOtherItem",
  upload.single("image"),
  convertToPng,
  updateOtherItem
);
adminRouter.delete("/deleteOtherItem/:id", deleteOtherItem);
adminRouter.get("/getAllOtherItems", getAllOtherItems);
adminRouter.get("/other-items", getAllOtherItems); // Add alternate endpoint for frontend

// Admin orders
adminRouter.get("/getOrderDetails/:id", getOrderDetails);
adminRouter.get("/getAllOrders", getAllOrders);
adminRouter.put("/changeOrderStatus/:id", changeOrderStatus);

// All peri-peri functionality moved to combo style items system

// New Combo Style Items (flexible replacement for Peri Peri)
adminRouter.get("/comboStyleItems", getAllComboStyleItems);
adminRouter.get("/comboStyleItems/:id", getComboStyleItemById);
adminRouter.post("/comboStyleItems", upload.single("image"), convertToPng, createComboStyleItem);
adminRouter.put("/comboStyleItems/:id", upload.single("image"), convertToPng, updateComboStyleItem);
adminRouter.delete("/comboStyleItems/:id", deleteComboStyleItem);
adminRouter.get("/sauces", getAvailableSauces);
adminRouter.get("/sides", getAvailableSides);
adminRouter.get("/drinks", getAvailableDrinks);

// Mount the admin router under /admin path
router.use("/admin", adminRouter);

export default router;
