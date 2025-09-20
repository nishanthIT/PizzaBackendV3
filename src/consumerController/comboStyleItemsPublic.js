import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all active combo style items for public consumption
export const getAllComboStyleItemsPublic = async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    const whereClause = {
      isActive: true,
      ...(categoryId && { categoryId })
    };
    
    const items = await prisma.comboStyleItem.findMany({
      where: whereClause,
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

// Get combo style item by ID for public consumption
export const getComboStyleItemByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.comboStyleItem.findFirst({
      where: { 
        id,
        isActive: true 
      },
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

// Get available sides (public)
export const getAvailableSidesPublic = async (req, res) => {
  try {
    console.log("Fetching sides - using real database IDs");
    
    // Use the real IDs from our database directly
    const sides = [
      { id: "cmfijpxn40003uk58upnvocxg", name: "Chips", price: 2.5, imageUrl: "chips.png" },
      { id: "cmfijpyct0005uk580cz7tcty", name: "Coleslaw", price: 2.0, imageUrl: "coleslaw.png" },
      { id: "cmfju8om10001uk54vsr1r0jm", name: "Corn on the Cob", price: 2.5, imageUrl: "corn.png" },
      { id: "cmfijpz7w0009uk58p2cosnup", name: "Rice", price: 2.0, imageUrl: "rice.png" },
      { id: "cmfijpzmc000buk58o782q3m0", name: "Beans", price: 2.0, imageUrl: "beans.png" },
      { id: "cmfju8psc0003uk5462xb4mem", name: "Mashed Potato", price: 2.5, imageUrl: "mashed-potato.png" },
      { id: "cmfju8q9i0005uk54542ifws2", name: "Garden Salad", price: 3.0, imageUrl: "salad.png" }
    ];
    
    console.log("Returning real sides with database IDs:", sides);
    res.status(200).json(sides);
    
  } catch (error) {
    console.error("Error fetching sides:", error);
    res.status(500).json({ message: "Error fetching sides", error: error.message });
  }
};

// Get available drinks (public)
export const getAvailableDrinksPublic = async (req, res) => {
  try {
    console.log("Fetching drinks - using real database IDs");
    
    // Use the real IDs from our database directly
    const drinks = [
      { id: "cmfijq0cf000duk58eywo5d85", name: "Coca Cola", price: 1.5, imageUrl: "cola.png" },
      { id: "cmfijq0yn000fuk58p7v7e1pg", name: "Pepsi", price: 1.5, imageUrl: "pepsi.png" },
      { id: "cmfju8r6k0007uk54ihx81qv2", name: "Sprite", price: 1.5, imageUrl: "sprite.png" },
      { id: "cmfijq1wo000juk58twvtsw2n", name: "Orange Juice", price: 2.0, imageUrl: "orange-juice.png" },
      { id: "cmfijq2dt000luk58b8wf4uqf", name: "Water", price: 1.0, imageUrl: "water.png" },
      { id: "cmfju8s2s0009uk54096vpj0h", name: "Lemonade", price: 1.8, imageUrl: "lemonade.png" },
      { id: "cmfju8sjx000buk54f0fgr1cq", name: "Iced Tea", price: 1.8, imageUrl: "iced-tea.png" }
    ];
    
    console.log("Returning real drinks with database IDs:", drinks);
    res.status(200).json(drinks);
    
  } catch (error) {
    console.error("Error fetching drinks:", error);
    res.status(500).json({ message: "Error fetching drinks", error: error.message });
  }
};
