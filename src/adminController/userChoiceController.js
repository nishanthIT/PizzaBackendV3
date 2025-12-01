import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `userchoice-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all UserChoices
export const getAllUserChoices = async (req, res) => {
  try {
    const userChoices = await prisma.userChoice.findMany({
      include: {
        displayCategory: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: userChoices
    });
  } catch (error) {
    console.error("Error fetching user choices:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user choices",
      error: error.message
    });
  }
};

// Get active UserChoices for homepage display
export const getActiveUserChoices = async (req, res) => {
  try {
    const activeUserChoices = await prisma.userChoice.findMany({
      where: {
        isActive: true,
        isOutOfStock: false,
        hideFromHomePage: false
      },
      include: {
        displayCategory: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: activeUserChoices
    });
  } catch (error) {
    console.error("Error fetching active user choices:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active user choices",
      error: error.message
    });
  }
};

// Get UserChoice by ID
export const getUserChoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userChoice = await prisma.userChoice.findUnique({
      where: { id },
      include: {
        displayCategory: {
          select: { id: true, name: true }
        }
      }
    });

    if (!userChoice) {
      return res.status(404).json({
        success: false,
        message: "User choice not found"
      });
    }

    res.status(200).json({
      success: true,
      data: userChoice
    });
  } catch (error) {
    console.error("Error fetching user choice:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user choice",
      error: error.message
    });
  }
};

// Create new UserChoice
export const createUserChoice = async (req, res) => {
  try {
    const {
      name,
      description,
      displayCategoryId,
      basePrice,
      categoryConfigs,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !displayCategoryId || !basePrice) {
      return res.status(400).json({
        success: false,
        message: "Name, display category, and base price are required"
      });
    }

    // Parse categoryConfigs if it's a string
    let parsedCategoryConfigs;
    try {
      parsedCategoryConfigs = typeof categoryConfigs === 'string' 
        ? JSON.parse(categoryConfigs) 
        : categoryConfigs;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid category configurations format"
      });
    }

    // Validate display category exists
    const displayCategory = await prisma.category.findUnique({
      where: { id: displayCategoryId }
    });

    if (!displayCategory) {
      return res.status(400).json({
        success: false,
        message: "Display category not found"
      });
    }

    const userChoiceData = {
      name,
      description: description || null,
      displayCategoryId,
      basePrice: parseFloat(basePrice),
      categoryConfigs: parsedCategoryConfigs || [],
      isActive: isActive === 'true' || isActive === true,
      imageUrl: req.file ? req.file.filename : null
    };

    const userChoice = await prisma.userChoice.create({
      data: userChoiceData,
      include: {
        displayCategory: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "User choice created successfully",
      data: userChoice
    });
  } catch (error) {
    console.error("Error creating user choice:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user choice",
      error: error.message
    });
  }
};

// Update UserChoice
export const updateUserChoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      displayCategoryId,
      basePrice,
      categoryConfigs,
      isActive
    } = req.body;

    // Check if user choice exists
    const existingUserChoice = await prisma.userChoice.findUnique({
      where: { id }
    });

    if (!existingUserChoice) {
      return res.status(404).json({
        success: false,
        message: "User choice not found"
      });
    }

    // Parse categoryConfigs if it's a string
    let parsedCategoryConfigs;
    if (categoryConfigs) {
      try {
        parsedCategoryConfigs = typeof categoryConfigs === 'string' 
          ? JSON.parse(categoryConfigs) 
          : categoryConfigs;
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid category configurations format"
        });
      }
    }

    // Validate display category if provided
    if (displayCategoryId) {
      const displayCategory = await prisma.category.findUnique({
        where: { id: displayCategoryId }
      });

      if (!displayCategory) {
        return res.status(400).json({
          success: false,
          message: "Display category not found"
        });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(displayCategoryId && { displayCategoryId }),
      ...(basePrice && { basePrice: parseFloat(basePrice) }),
      ...(parsedCategoryConfigs && { categoryConfigs: parsedCategoryConfigs }),
      ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
      ...(req.file && { imageUrl: req.file.filename })
    };

    const userChoice = await prisma.userChoice.update({
      where: { id },
      data: updateData,
      include: {
        displayCategory: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "User choice updated successfully",
      data: userChoice
    });
  } catch (error) {
    console.error("Error updating user choice:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user choice",
      error: error.message
    });
  }
};

// Delete UserChoice
export const deleteUserChoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user choice exists
    const existingUserChoice = await prisma.userChoice.findUnique({
      where: { id }
    });

    if (!existingUserChoice) {
      return res.status(404).json({
        success: false,
        message: "User choice not found"
      });
    }

    await prisma.userChoice.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: "User choice deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user choice:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user choice",
      error: error.message
    });
  }
};

// Get items for a specific category (for UserChoice configuration)
export const getCategoryItems = async (req, res) => {
  try {
    const { categoryId, type } = req.query;

    if (!categoryId || !type) {
      return res.status(400).json({
        success: false,
        message: "Category ID and type are required"
      });
    }

    let items = [];

    if (type === 'pizza') {
      items = await prisma.pizza.findMany({
        where: { categoryId },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          sizes: true // Contains pricing for different sizes
        },
        orderBy: { name: 'asc' }
      });
    } else if (type === 'other') {
      items = await prisma.otherItem.findMany({
        where: { categoryId },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true
        },
        orderBy: { name: 'asc' }
      });
    }

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error("Error fetching category items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category items",
      error: error.message
    });
  }
};

// Middleware for file upload
export const uploadMiddleware = upload.single('image');

// Toggle out of stock status for user choices
export const toggleUserChoiceOutOfStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOutOfStock } = req.body;

    const userChoice = await prisma.userChoice.update({
      where: { id },
      data: { isOutOfStock: Boolean(isOutOfStock) },
    });

    return res.status(200).json({
      success: true,
      message: `User Choice ${isOutOfStock ? 'marked as out of stock' : 'marked as available'}`,
      userChoice
    });
  } catch (error) {
    console.error("Error updating user choice out of stock status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Toggle hide from home page status for user choices
export const toggleUserChoiceHideFromHomePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { hideFromHomePage } = req.body;

    const userChoice = await prisma.userChoice.update({
      where: { id },
      data: { hideFromHomePage: Boolean(hideFromHomePage) },
    });

    return res.status(200).json({
      success: true,
      message: `User Choice ${hideFromHomePage ? 'hidden from home page' : 'shown on home page'}`,
      userChoice
    });
  } catch (error) {
    console.error("Error updating user choice hide from home page status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default {
  getAllUserChoices,
  getActiveUserChoices,
  getUserChoiceById,
  createUserChoice,
  updateUserChoice,
  deleteUserChoice,
  getCategoryItems,
  uploadMiddleware,
  toggleUserChoiceOutOfStock,
  toggleUserChoiceHideFromHomePage
};