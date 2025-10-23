import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all active pizza builder deals (public)
const getAllActivePizzaBuilderDeals = async (req, res) => {
  try {
    const { categoryId, showInactive } = req.query;
    
    const whereClause = {
      ...(showInactive !== 'true' && { isActive: true }),
      ...(categoryId && { displayCategoryId: categoryId }),
    };

    const deals = await prisma.pizzaBuilderDeal.findMany({
      where: whereClause,
      include: {
        displayCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(deals);
  } catch (error) {
    console.error('Error fetching active pizza builder deals:', error);
    res.status(500).json({ error: 'Failed to fetch pizza builder deals' });
  }
};

// Get single pizza builder deal with full details including available pizzas (public)
const getPizzaBuilderDealByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowInactive } = req.query;

    const whereClause = {
      id,
      ...(allowInactive !== 'true' && { isActive: true }),
    };

    const deal = await prisma.pizzaBuilderDeal.findFirst({
      where: whereClause,
      include: {
        displayCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Pizza builder deal not found' });
    }

    // Fetch topping details
    const availableToppings = deal.availableToppings || [];
    
    // Extract topping IDs - availableToppings is array of objects with id and name
    const toppingIds = availableToppings.map(t => t.id).filter(Boolean);
    
    const toppings = await prisma.toppingsList.findMany({
      where: {
        id: {
          in: toppingIds,
        },
        status: true, // Only active toppings
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    // Return deal with enriched data
    res.json({
      ...deal,
      availableToppings: toppings, // Use this directly in frontend
      toppingsDetails: toppings, // Keep for backward compatibility
    });
  } catch (error) {
    console.error('Error fetching pizza builder deal:', error);
    res.status(500).json({ error: 'Failed to fetch pizza builder deal' });
  }
};

export {
  getAllActivePizzaBuilderDeals,
  getPizzaBuilderDealByIdPublic,
};
