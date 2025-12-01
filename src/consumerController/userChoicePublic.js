import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all active UserChoices for public consumption
export const getAllUserChoicesPublic = async (req, res) => {
  try {
    console.log("🔧 getAllUserChoicesPublic called");
    const { categoryId, showInactive } = req.query;
    
    const whereClause = {
      // Only filter by isActive if showInactive is not true
      ...(showInactive !== 'true' && { isActive: true }),
      ...(categoryId && { displayCategoryId: categoryId }),
      isOutOfStock: false // Filter out out-of-stock items
    };
    
    console.log("🔧 Query filters:", whereClause);
    
    const userChoices = await prisma.userChoice.findMany({
      where: whereClause,
      include: {
        displayCategory: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log("🔧 Found UserChoices:", userChoices.length);
    console.log("🔧 UserChoices data:", userChoices.map(choice => ({
      id: choice.id,
      name: choice.name,
      displayCategoryId: choice.displayCategoryId,
      isActive: choice.isActive
    })));
    
    // Add cache control headers to prevent frontend caching of out-of-stock items
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.status(200).json(userChoices);
  } catch (error) {
    console.error("Error fetching user choices:", error);
    res.status(500).json({ 
      message: "Error fetching user choices", 
      error: error.message 
    });
  }
};

// Get UserChoice by ID for public consumption
export const getUserChoiceByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowInactive } = req.query;
    
    const whereClause = {
      id,
      // Only filter by isActive if allowInactive is not true
      ...(allowInactive !== 'true' && { isActive: true }),
      isOutOfStock: false // Filter out out-of-stock items
    };
    
    const userChoice = await prisma.userChoice.findFirst({
      where: whereClause,
      include: {
        displayCategory: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!userChoice) {
      return res.status(404).json({ message: "User choice not found" });
    }
    
    res.status(200).json(userChoice);
  } catch (error) {
    console.error("Error fetching user choice:", error);
    res.status(500).json({ 
      message: "Error fetching user choice", 
      error: error.message 
    });
  }
};

// Get available items for a UserChoice category configuration
export const getUserChoiceItems = async (req, res) => {
  try {
    const { userChoiceId, categoryType, categoryId, allowInactive } = req.query;
    
    console.log('🔧 Fetching items for UserChoice:', userChoiceId, 'categoryType:', categoryType, 'categoryId:', categoryId);
    
    if (!userChoiceId || !categoryType) {
      return res.status(400).json({ 
        message: "User choice ID and category type are required" 
      });
    }
    
    // Get the UserChoice to find the category configuration
    const whereClause = {
      id: userChoiceId,
      // Only filter by isActive if allowInactive is not true
      ...(allowInactive !== 'true' && { isActive: true })
    };
    
    const userChoice = await prisma.userChoice.findUnique({
      where: whereClause
    });
    
    if (!userChoice) {
      return res.status(404).json({ message: "User choice not found" });
    }
    
    // Find the specific category configuration
    const categoryConfigs = Array.isArray(userChoice.categoryConfigs) 
      ? userChoice.categoryConfigs 
      : [];
      
    // If categoryId is provided, find by both type and categoryId for precision
    const categoryConfig = categoryId 
      ? categoryConfigs.find(config => config.type === categoryType && config.categoryId === categoryId)
      : categoryConfigs.find(config => config.type === categoryType);
    
    if (!categoryConfig) {
      console.log('🔧 No category config found for type:', categoryType, 'categoryId:', categoryId);
      return res.status(200).json([]);
    }
    
    console.log('🔧 Found category config:', categoryConfig);
    
    let items = [];
    
    if (categoryConfig.type === 'pizza') {
      items = await prisma.pizza.findMany({
        where: {
          categoryId: categoryConfig.categoryId
        },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          sizes: true // Contains pricing for different sizes
        },
        orderBy: { name: 'asc' }
      });
    } else if (categoryConfig.type === 'other' || categoryConfig.type === 'burger' || categoryConfig.type === 'drink' || categoryConfig.type === 'side') {
      // Handle all non-pizza items (burgers, drinks, sides, others)
      items = await prisma.otherItem.findMany({
        where: {
          categoryId: categoryConfig.categoryId
        },
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
    
    console.log('🔧 Found items:', items.length);
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching user choice items:", error);
    res.status(500).json({ 
      message: "Error fetching items", 
      error: error.message 
    });
  }
};

export default {
  getAllUserChoicesPublic,
  getUserChoiceByIdPublic,
  getUserChoiceItems
};