import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// PUBLIC ENDPOINTS (no authentication required)

// Get all active combo style items for public
export const getAllComboStyleItemsPublic = async (req, res) => {
  try {
    const items = await prisma.comboStyleItem.findMany({
      where: { isActive: true },
      include: {
        category: true,
        sidesCategory: {
          select: { id: true, name: true }
        },
        drinksCategory: {
          select: { id: true, name: true }
        }
      }
    });
    
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching combo style items:", error);
    res.status(500).json({ message: "Error fetching combo style items", error: error.message });
  }
};

// Get combo style item by ID for public
export const getComboStyleItemByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.comboStyleItem.findUnique({
      where: { id, isActive: true },
      include: {
        category: true,
        sidesCategory: {
          select: { id: true, name: true }
        },
        drinksCategory: {
          select: { id: true, name: true }
        }
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

// Get available sides for combo style items based on item's sides category
export const getComboStyleItemSidesPublic = async (req, res) => {
  try {
    const { itemId } = req.query;

    console.log('🔧 Fetching sides for combo style item:', itemId);

    // First get the combo style item to find its sides category
    const item = await prisma.comboStyleItem.findUnique({
      where: { id: itemId, isActive: true },
      select: {
        sidesCategoryId: true,
        sidesCategory: {
          select: { id: true, name: true }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: "Combo style item not found" });
    }

    if (!item.sidesCategoryId) {
      console.log('🔧 No sides category configured for this item');
      return res.status(200).json([]);
    }

    console.log('🔧 Fetching sides from category:', item.sidesCategoryId);

    const sides = await prisma.otherItem.findMany({
      where: {
        categoryId: item.sidesCategoryId,
        // Note: We might want to add isActive filter here if otherItems have that field
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

    console.log('🔧 Found sides:', sides.length);
    res.status(200).json(sides);
  } catch (error) {
    console.error("Error fetching sides for combo style item:", error);
    res.status(500).json({ message: "Error fetching sides", error: error.message });
  }
};

// Get available drinks for combo style items based on item's drinks category
export const getComboStyleItemDrinksPublic = async (req, res) => {
  try {
    const { itemId } = req.query;

    console.log('🔧 Fetching drinks for combo style item:', itemId);

    // First get the combo style item to find its drinks category
    const item = await prisma.comboStyleItem.findUnique({
      where: { id: itemId, isActive: true },
      select: {
        drinksCategoryId: true,
        drinksCategory: {
          select: { id: true, name: true }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: "Combo style item not found" });
    }

    if (!item.drinksCategoryId) {
      console.log('🔧 No drinks category configured for this item');
      return res.status(200).json([]);
    }

    console.log('🔧 Fetching drinks from category:', item.drinksCategoryId);

    const drinks = await prisma.otherItem.findMany({
      where: {
        categoryId: item.drinksCategoryId,
        // Note: We might want to add isActive filter here if otherItems have that field
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

    console.log('🔧 Found drinks:', drinks.length);
    res.status(200).json(drinks);
  } catch (error) {
    console.error("Error fetching drinks for combo style item:", error);
    res.status(500).json({ message: "Error fetching drinks", error: error.message });
  }
};

// Get available sauces (static list)
export const getAvailableSaucesPublic = async (req, res) => {
  try {
    const sauces = [
      "BBQ",
      "Peri Peri Medium",
      "Peri Peri Hot", 
      "Peri Peri Extra Hot",
      "Lemon Herbs",
      "Mango Lime",
      "Garlic",
      "Honey Mustard",
      "Sweet Chili",
      "Mild",
      "Plain"
    ];
    
    res.status(200).json(sauces);
  } catch (error) {
    console.error("Error fetching sauces:", error);
    res.status(500).json({ message: "Error fetching sauces", error: error.message });
  }
};

export default router;