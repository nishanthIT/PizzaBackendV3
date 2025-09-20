import { PrismaClient } from "@prisma/client";
import path from "path";
import { deleteFile } from "../middleware/upload.js";

const prisma = new PrismaClient();

// Get all combo style items
const getAllComboStyleItems = async (req, res) => {
  try {
    const items = await prisma.comboStyleItem.findMany({
      include: {
        category: true
      }
    });
    
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching combo style items:", error);
    res.status(500).json({ message: "Error fetching combo style items", error: error.message });
  }
};

// Get combo style item by ID
const getComboStyleItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.comboStyleItem.findUnique({
      where: { id },
      include: {
        category: true
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: "Combo style item not found" });
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching combo style item:", error);
    res.status(500).json({ message: "Error fetching combo style item", error: error.message });
  }
};

// Create new combo style item
const createComboStyleItem = async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      sizePricing,
      availableSauces,
      mealDealConfig,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !categoryId || !sizePricing) {
      return res.status(400).json({ 
        message: "Name, category, and size pricing are required" 
      });
    }

    // Parse JSON fields if they come as strings
    const parsedSizePricing = typeof sizePricing === 'string' ? JSON.parse(sizePricing) : sizePricing;
    const parsedAvailableSauces = availableSauces ? (typeof availableSauces === 'string' ? JSON.parse(availableSauces) : availableSauces) : [];
    const parsedMealDealConfig = mealDealConfig ? (typeof mealDealConfig === 'string' ? JSON.parse(mealDealConfig) : mealDealConfig) : {};
    const parsedIsActive = typeof isActive === 'string' ? isActive === 'true' : isActive;

    // First, create the item without image to get the ID
    const item = await prisma.comboStyleItem.create({
      data: {
        name,
        description,
        categoryId,
        sizePricing: parsedSizePricing,
        availableSauces: parsedAvailableSauces,
        mealDealConfig: parsedMealDealConfig,
        isActive: parsedIsActive,
        imageUrl: null // Will be updated after image processing
      },
      include: {
        category: true
      }
    });

    // Handle image upload if present
    if (req.file) {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadsDir = path.join(__dirname, "../uploads");
      
      // New filename with the actual item ID
      const newFilename = `combostyle-${item.id}.png`;
      const oldPath = req.file.path;
      const newPath = path.join(uploadsDir, newFilename);
      
      // Rename the uploaded file to use the proper ID
      fs.renameSync(oldPath, newPath);
      
      // Update the item with the correct image filename
      const updatedItem = await prisma.comboStyleItem.update({
        where: { id: item.id },
        data: { imageUrl: newFilename },
        include: { category: true }
      });
      
      return res.status(201).json(updatedItem);
    }

    res.status(201).json(item);
  } catch (error) {
    // If there was an error and we uploaded a file, clean it up
    if (req.file) {
      deleteFile(req.file.filename);
    }
    console.error("Error creating combo style item:", error);
    res.status(500).json({ message: "Error creating combo style item", error: error.message });
  }
};

// Update combo style item
// Update the updateComboStyleItem function with better logging

const updateComboStyleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log('🔧 Update request for item:', id);
    console.log('🔧 Raw request body:', req.body);

    // Get existing item to check for current image
    const existingItem = await prisma.comboStyleItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Combo style item not found" });
    }

    console.log('🔧 Existing item mealDealConfig:', existingItem.mealDealConfig);

    // Parse JSON fields if they come as strings
    if (updateData.sizePricing && typeof updateData.sizePricing === 'string') {
      updateData.sizePricing = JSON.parse(updateData.sizePricing);
      console.log('🔧 Parsed sizePricing:', updateData.sizePricing);
    }
    if (updateData.availableSauces && typeof updateData.availableSauces === 'string') {
      updateData.availableSauces = JSON.parse(updateData.availableSauces);
    }
    if (updateData.mealDealConfig && typeof updateData.mealDealConfig === 'string') {
      updateData.mealDealConfig = JSON.parse(updateData.mealDealConfig);
      console.log('🔧 Parsed mealDealConfig:', updateData.mealDealConfig);
    }
    if (updateData.isActive && typeof updateData.isActive === 'string') {
      updateData.isActive = updateData.isActive === 'true';
    }

    // Handle category IDs - these are not in the current schema
    // Remove sidesCategoryId and drinksCategoryId references
    delete updateData.sidesCategoryId;
    delete updateData.drinksCategoryId;

    console.log('🔧 Final updateData before database update:', {
      sizePricing: updateData.sizePricing,
      mealDealConfig: updateData.mealDealConfig
    });

    // Handle image upload
    if (req.file) {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadsDir = path.join(__dirname, "../uploads");
      
      // Delete old image if it exists
      if (existingItem.imageUrl) {
        deleteFile(existingItem.imageUrl);
      }
      
      // New filename with the item ID
      const newFilename = `combostyle-${id}.png`;
      const oldPath = req.file.path;
      const newPath = path.join(uploadsDir, newFilename);
      
      // Rename the uploaded file to use the proper ID
      fs.renameSync(oldPath, newPath);
      
      // Set new image filename in update data
      updateData.imageUrl = newFilename;
    }

    const item = await prisma.comboStyleItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    console.log('🔧 Updated item mealDealConfig:', item.mealDealConfig);

    res.status(200).json(item);
  } catch (error) {
    // If there was an error and we uploaded a file, clean it up
    if (req.file) {
      deleteFile(req.file.filename);
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Combo style item not found" });
    }
    console.error("Error updating combo style item:", error);
    res.status(500).json({ message: "Error updating combo style item", error: error.message });
  }
};

// Delete combo style item
const deleteComboStyleItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing item to delete its image
    const existingItem = await prisma.comboStyleItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Combo style item not found" });
    }

    // Delete the item from database
    await prisma.comboStyleItem.delete({
      where: { id }
    });

    // Delete associated image file if it exists
    if (existingItem.imageUrl) {
      deleteFile(existingItem.imageUrl);
    }

    res.status(200).json({ message: "Combo style item deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Combo style item not found" });
    }
    console.error("Error deleting combo style item:", error);
    res.status(500).json({ message: "Error deleting combo style item", error: error.message });
  }
};

// Global configuration for sauces, sides, and drinks
// These could be stored in a separate configuration table or as JSON files

// Get available sauces (global configuration)
const getAvailableSauces = async (req, res) => {
  try {
    // For now, return a default set of sauces
    // In the future, this could be stored in a database table
    const sauces = [
      "Periperi Medium",
      "Periperi Hot", 
      "BBQ",
      "Lemon and Herbs",
      "Mango and Lime",
      "Extra Hot",
      "Mild",
      "Garlic",
      "Honey Mustard"
    ];
    
    res.status(200).json(sauces);
  } catch (error) {
    console.error("Error fetching sauces:", error);
    res.status(500).json({ message: "Error fetching sauces", error: error.message });
  }
};

// Get available sides (global configuration)
// Get available sides (from database)
const getAvailableSides = async (req, res) => {
  try {
    const sides = await prisma.side.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    res.status(200).json(sides);
  } catch (error) {
    console.error("Error fetching sides:", error);
    res.status(500).json({ message: "Error fetching sides", error: error.message });
  }
};

// Get available drinks (from database)
const getAvailableDrinks = async (req, res) => {
  try {
    const drinks = await prisma.drink.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    res.status(200).json(drinks);
  } catch (error) {
    console.error("Error fetching drinks:", error);
    res.status(500).json({ message: "Error fetching drinks", error: error.message });
  }
};

// PUBLIC VERSIONS (no authentication required)
// These are used by the frontend consumer pages

const getAllComboStyleItemsPublic = async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    // Build where clause with optional category filter
    const whereClause = {
      isActive: true,
      ...(categoryId && { categoryId })
    };
    
    console.log("Fetching combo style items with filter:", whereClause);
    
    const items = await prisma.comboStyleItem.findMany({
      where: whereClause,
      include: {
        category: true
      }
    });
    
    console.log(`Found ${items.length} combo style items for category ${categoryId || 'all'}`);
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching combo style items:", error);
    res.status(500).json({ message: "Error fetching combo style items", error: error.message });
  }
};

const getComboStyleItemByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.comboStyleItem.findUnique({
      where: { id, isActive: true },
      include: {
        category: true
      }
    });
    
    if (!item) {
      return res.status(404).json({ message: "Combo style item not found" });
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching combo style item:", error);
    res.status(500).json({ message: "Error fetching combo style item", error: error.message });
  }
};

// Get available sides for combo style items based on configured category
const getAvailableSidesPublic = async (req, res) => {
  try {
    const { itemId, size } = req.query;

    if (!itemId || !size) {
      return res.status(400).json({ error: "itemId and size are required" });
    }

    // Get the combo style item to check its meal deal config
    const comboItem = await prisma.comboStyleItem.findUnique({
      where: { id: itemId }
    });

    if (!comboItem) {
      return res.status(404).json({ error: "Combo style item not found" });
    }

    // Get the meal deal config for the specific size
    const mealDealInfo = comboItem.mealDealConfig?.[size];
    if (!mealDealInfo || !mealDealInfo.sides || !mealDealInfo.sides.categoryId) {
      return res.json([]); // No sides configured for this size
    }

    const sidesCategoryId = mealDealInfo.sides.categoryId;

    // Fetch items from the sides category
    const sides = await prisma.otherItem.findMany({
      where: {
        categoryId: sidesCategoryId,
        // Add any additional filters if needed (e.g., isActive: true)
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`🔧 Found ${sides.length} sides for category ${sidesCategoryId}, size ${size}`);
    res.json(sides);
  } catch (error) {
    console.error("Error fetching available sides:", error);
    res.status(500).json({ error: "Failed to fetch available sides" });
  }
};


// Get available drinks for combo style items based on configured category
const getAvailableDrinksPublic = async (req, res) => {
  try {
    const { itemId, size } = req.query;

    if (!itemId || !size) {
      return res.status(400).json({ error: "itemId and size are required" });
    }

    // Get the combo style item to check its meal deal config
    const comboItem = await prisma.comboStyleItem.findUnique({
      where: { id: itemId }
    });

    if (!comboItem) {
      return res.status(404).json({ error: "Combo style item not found" });
    }

    // Get the meal deal config for the specific size
    const mealDealInfo = comboItem.mealDealConfig?.[size];
    if (!mealDealInfo || !mealDealInfo.drinks || !mealDealInfo.drinks.categoryId) {
      return res.json([]); // No drinks configured for this size
    }

    const drinksCategoryId = mealDealInfo.drinks.categoryId;

    // Fetch items from the drinks category
    const drinks = await prisma.otherItem.findMany({
      where: {
        categoryId: drinksCategoryId,
        // Add any additional filters if needed (e.g., isActive: true)
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`🔧 Found ${drinks.length} drinks for category ${drinksCategoryId}, size ${size}`);
    res.json(drinks);
  } catch (error) {
    console.error("Error fetching available drinks:", error);
    res.status(500).json({ error: "Failed to fetch available drinks" });
  }
};



// Export all functions for both admin and consumer routes
export { 
  // Admin functions
  getAllComboStyleItems,
  getComboStyleItemById,
  createComboStyleItem,
  updateComboStyleItem,
  deleteComboStyleItem,
  getAvailableSides,
  getAvailableDrinks,
  // Public functions for consumer routes
  getAllComboStyleItemsPublic,
  getComboStyleItemByIdPublic,
  getAvailableSidesPublic,
  getAvailableDrinksPublic,
  getAvailableSauces
};























