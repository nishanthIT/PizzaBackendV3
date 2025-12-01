import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all peri peri items (admin)
const getAllPeriPeriItems = async (req, res) => {
  try {
    const periPeriItems = await prisma.periPeriItem.findMany({
      orderBy: [
        { itemType: 'asc' },
        { basePrice: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: periPeriItems
    });
  } catch (error) {
    console.error("Error fetching peri peri items:", error);
    res.status(500).json({ error: "Failed to fetch peri peri items" });
  }
};

// Toggle out of stock status for peri peri items
const togglePeriPeriOutOfStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOutOfStock } = req.body;

    const periPeriItem = await prisma.periPeriItem.update({
      where: { id },
      data: { isOutOfStock: Boolean(isOutOfStock) },
    });

    return res.status(200).json({
      success: true,
      message: `Peri Peri Item ${isOutOfStock ? 'marked as out of stock' : 'marked as available'}`,
      periPeriItem
    });
  } catch (error) {
    console.error("Error updating peri peri item out of stock status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export {
  getAllPeriPeriItems,
  togglePeriPeriOutOfStock
};