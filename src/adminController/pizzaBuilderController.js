import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all pizza builder deals (admin)
const getAllPizzaBuilderDeals = async (req, res) => {
  try {
    const deals = await prisma.pizzaBuilderDeal.findMany({
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
    console.error('Error fetching pizza builder deals:', error);
    res.status(500).json({ error: 'Failed to fetch pizza builder deals' });
  }
};

// Get single pizza builder deal by ID (admin)
const getPizzaBuilderDealById = async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.pizzaBuilderDeal.findUnique({
      where: { id },
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

    res.json(deal);
  } catch (error) {
    console.error('Error fetching pizza builder deal:', error);
    res.status(500).json({ error: 'Failed to fetch pizza builder deal' });
  }
};

// Create new pizza builder deal
const createPizzaBuilderDeal = async (req, res) => {
  try {
    const {
      name,
      description,
      imageUrl,
      maxToppings,
      displayCategoryId,
      availableBases,
      availableSizes,
      availableSauces,
      availableToppings,
      sizePricing,
      isActive,
    } = req.body;

    // Parse JSON strings from FormData
    const parsedBases = typeof availableBases === 'string' ? JSON.parse(availableBases) : availableBases;
    const parsedSizes = typeof availableSizes === 'string' ? JSON.parse(availableSizes) : availableSizes;
    const parsedSauces = typeof availableSauces === 'string' ? JSON.parse(availableSauces) : availableSauces;
    const parsedToppings = typeof availableToppings === 'string' ? JSON.parse(availableToppings) : availableToppings;
    const parsedPricing = typeof sizePricing === 'string' ? JSON.parse(sizePricing) : sizePricing;
    const parsedMaxToppings = typeof maxToppings === 'string' ? parseInt(maxToppings, 10) : maxToppings;
    const parsedIsActive = typeof isActive === 'string' ? isActive === 'true' : isActive;

    // Validate required fields
    if (!name || !displayCategoryId || !parsedBases || !parsedSizes || !parsedSauces || !parsedToppings || !parsedPricing) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: displayCategoryId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create the deal
    const deal = await prisma.pizzaBuilderDeal.create({
      data: {
        name,
        description,
        imageUrl,
        maxToppings: parsedMaxToppings || 4,
        displayCategoryId,
        availableBases: parsedBases,
        availableSizes: parsedSizes,
        availableSauces: parsedSauces,
        availableToppings: parsedToppings,
        sizePricing: parsedPricing,
        isActive: parsedIsActive !== undefined ? parsedIsActive : true,
      },
      include: {
        displayCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating pizza builder deal:', error);
    res.status(500).json({ error: 'Failed to create pizza builder deal' });
  }
};

// Update pizza builder deal
const updatePizzaBuilderDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      imageUrl,
      maxToppings,
      displayCategoryId,
      availableBases,
      availableSizes,
      availableSauces,
      availableToppings,
      sizePricing,
      isActive,
    } = req.body;

    // Parse JSON strings from FormData
    const parsedBases = availableBases && typeof availableBases === 'string' ? JSON.parse(availableBases) : availableBases;
    const parsedSizes = availableSizes && typeof availableSizes === 'string' ? JSON.parse(availableSizes) : availableSizes;
    const parsedSauces = availableSauces && typeof availableSauces === 'string' ? JSON.parse(availableSauces) : availableSauces;
    const parsedToppings = availableToppings && typeof availableToppings === 'string' ? JSON.parse(availableToppings) : availableToppings;
    const parsedPricing = sizePricing && typeof sizePricing === 'string' ? JSON.parse(sizePricing) : sizePricing;
    const parsedMaxToppings = maxToppings && typeof maxToppings === 'string' ? parseInt(maxToppings, 10) : maxToppings;
    const parsedIsActive = isActive !== undefined && typeof isActive === 'string' ? isActive === 'true' : isActive;

    // Check if deal exists
    const existingDeal = await prisma.pizzaBuilderDeal.findUnique({
      where: { id },
    });

    if (!existingDeal) {
      return res.status(404).json({ error: 'Pizza builder deal not found' });
    }

    // If category is being updated, verify it exists
    if (displayCategoryId) {
      const category = await prisma.category.findUnique({
        where: { id: displayCategoryId },
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    // Update the deal
    const updatedDeal = await prisma.pizzaBuilderDeal.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(parsedMaxToppings !== undefined && { maxToppings: parsedMaxToppings }),
        ...(displayCategoryId && { displayCategoryId }),
        ...(parsedBases && { availableBases: parsedBases }),
        ...(parsedSizes && { availableSizes: parsedSizes }),
        ...(parsedSauces && { availableSauces: parsedSauces }),
        ...(parsedToppings && { availableToppings: parsedToppings }),
        ...(parsedPricing && { sizePricing: parsedPricing }),
        ...(parsedIsActive !== undefined && { isActive: parsedIsActive }),
      },
      include: {
        displayCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updatedDeal);
  } catch (error) {
    console.error('Error updating pizza builder deal:', error);
    res.status(500).json({ error: 'Failed to update pizza builder deal' });
  }
};

// Delete pizza builder deal
const deletePizzaBuilderDeal = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if deal exists
    const deal = await prisma.pizzaBuilderDeal.findUnique({
      where: { id },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Pizza builder deal not found' });
    }

    // Delete the deal (cascade will handle cart and order items)
    await prisma.pizzaBuilderDeal.delete({
      where: { id },
    });

    res.json({ message: 'Pizza builder deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting pizza builder deal:', error);
    res.status(500).json({ error: 'Failed to delete pizza builder deal' });
  }
};

// Toggle active status
const togglePizzaBuilderDealStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if deal exists
    const deal = await prisma.pizzaBuilderDeal.findUnique({
      where: { id },
    });

    if (!deal) {
      return res.status(404).json({ error: 'Pizza builder deal not found' });
    }

    // Toggle status
    const updatedDeal = await prisma.pizzaBuilderDeal.update({
      where: { id },
      data: {
        isActive: !deal.isActive,
      },
      include: {
        displayCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updatedDeal);
  } catch (error) {
    console.error('Error toggling pizza builder deal status:', error);
    res.status(500).json({ error: 'Failed to toggle pizza builder deal status' });
  }
};

export {
  getAllPizzaBuilderDeals,
  getPizzaBuilderDealById,
  createPizzaBuilderDeal,
  updatePizzaBuilderDeal,
  deletePizzaBuilderDeal,
  togglePizzaBuilderDealStatus,
};
