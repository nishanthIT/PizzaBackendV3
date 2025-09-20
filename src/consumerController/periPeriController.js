import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getAllPeriPeriItems = async (req, res) => {
  try {
    const periPeriItems = await prisma.periPeriItem.findMany({
      orderBy: [
        { itemType: 'asc' }, // quarter, half, whole, wings
        { basePrice: 'asc' }
      ]
    });

    res.json(periPeriItems);
  } catch (error) {
    console.error("Error fetching peri peri items:", error);
    res.status(500).json({ error: "Failed to fetch peri peri items" });
  }
};

const getPeriPeriItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const periPeriItem = await prisma.periPeriItem.findUnique({
      where: { id }
    });

    if (!periPeriItem) {
      return res.status(404).json({ message: "Peri Peri item not found" });
    }

    res.json(periPeriItem);
  } catch (error) {
    console.error("Error fetching peri peri item:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get available sides for meal deals
const getAvailableSides = async (req, res) => {
  try {
    // Get sides from other items or create a dedicated sides table
    const sides = await prisma.otherItem.findMany({
      where: {
        category: {
          name: { in: ["Sides", "Side"] }
        }
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true
      }
    });

    // Fallback hardcoded sides if no sides category exists
    const fallbackSides = [
      { id: "side-1", name: "Chips", price: 2.50, imageUrl: "chips.png" },
      { id: "side-2", name: "Coleslaw", price: 2.00, imageUrl: "coleslaw.png" },
      { id: "side-3", name: "Corn on the Cob", price: 2.50, imageUrl: "corn.png" },
      { id: "side-4", name: "Rice", price: 2.00, imageUrl: "rice.png" },
      { id: "side-5", name: "Beans", price: 2.00, imageUrl: "beans.png" }
    ];

    res.json(sides.length > 0 ? sides : fallbackSides);
  } catch (error) {
    console.error("Error fetching available sides:", error);
    res.status(500).json({ error: "Failed to fetch available sides" });
  }
};

// Get available drinks for meal deals
const getAvailableDrinks = async (req, res) => {
  try {
    // Get drinks from other items or create a dedicated drinks table
    const drinks = await prisma.otherItem.findMany({
      where: {
        category: {
          name: { in: ["Drinks", "Drink", "Beverages"] }
        }
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true
      }
    });

    // Fallback hardcoded drinks if no drinks category exists
    const fallbackDrinks = [
      { id: "drink-1", name: "Coca Cola", price: 1.50, imageUrl: "cola.png" },
      { id: "drink-2", name: "Pepsi", price: 1.50, imageUrl: "pepsi.png" },
      { id: "drink-3", name: "Sprite", price: 1.50, imageUrl: "sprite.png" },
      { id: "drink-4", name: "Orange Juice", price: 2.00, imageUrl: "orange.png" },
      { id: "drink-5", name: "Water", price: 1.00, imageUrl: "water.png" }
    ];

    res.json(drinks.length > 0 ? drinks : fallbackDrinks);
  } catch (error) {
    console.error("Error fetching available drinks:", error);
    res.status(500).json({ error: "Failed to fetch available drinks" });
  }
};

export { 
  getAllPeriPeriItems, 
  getPeriPeriItemById, 
  getAvailableSides, 
  getAvailableDrinks 
};
