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
    console.log('=== BACKEND CREATE DEBUG ===');
    console.log('req.body:', req.body);
    console.log('req.body.toppingsData (raw):', req.body.toppingsData);
    console.log('req.body.availableToppings (should not exist):', req.body.availableToppings);
    
    const {
      name,
      description,
      imageUrl,
      maxToppings,
      displayCategoryId,
      availableBases,
      availableSizes,
      toppingsData, // Use toppingsData instead of availableToppings
      mediumPrice,
      largePrice,
      superSizePrice,
      isActive,
    } = req.body;

    // Parse JSON strings from FormData
    const parsedBases = typeof availableBases === 'string' ? JSON.parse(availableBases) : availableBases;
    const parsedSizes = typeof availableSizes === 'string' ? JSON.parse(availableSizes) : availableSizes;
    const parsedToppingsData = typeof toppingsData === 'string' ? JSON.parse(toppingsData) : (toppingsData || {});
    const parsedMaxToppings = typeof maxToppings === 'string' ? parseInt(maxToppings, 10) : maxToppings;
    const parsedIsActive = typeof isActive === 'string' ? isActive === 'true' : isActive;

    console.log('Parsed toppingsData:', parsedToppingsData);
    console.log('Type of parsedToppingsData:', typeof parsedToppingsData);

    // Parse pricing fields - Medium, Large, Super Size
    const parsedMediumPrice = mediumPrice ? parseFloat(mediumPrice) : null;
    const parsedLargePrice = largePrice ? parseFloat(largePrice) : null;
    const parsedSuperSizePrice = superSizePrice ? parseFloat(superSizePrice) : null;

    // Validate required fields - Updated to use toppingsData instead of parsedToppings
    if (!name || !displayCategoryId || !parsedBases || !parsedSizes || !parsedToppingsData || Object.keys(parsedToppingsData).length === 0) {
      return res.status(400).json({ error: 'Missing required fields or no toppings selected' });
    }

    // Validate at least one price is provided
    if (!parsedMediumPrice && !parsedLargePrice && !parsedSuperSizePrice) {
      return res.status(400).json({ error: 'At least one size price must be provided' });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: displayCategoryId },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create the deal
    const dealData = {
      name,
      description,
      imageUrl,
      maxToppings: parsedMaxToppings || 4,
      displayCategoryId,
      availableBases: parsedBases,
      availableSizes: parsedSizes,
      availableSauces: ['Tomato Sauce', 'BBQ Sauce', 'White Sauce', 'Pesto', 'Garlic Butter'], // Default sauces
      availableToppings: parsedToppingsData, // Store {id: name} format in availableToppings too
      toppingsData: parsedToppingsData, // Store {id: name} format
      mediumPrice: parsedMediumPrice,
      largePrice: parsedLargePrice,
      superSizePrice: parsedSuperSizePrice,
      isActive: parsedIsActive !== undefined ? parsedIsActive : true,
    };

    console.log('Data being stored to database:', dealData);
    console.log('dealData.toppingsData:', dealData.toppingsData);
    console.log('dealData.availableToppings (now {id: name} format):', dealData.availableToppings);

    const deal = await prisma.pizzaBuilderDeal.create({
      data: dealData,
      include: {
        displayCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('Created deal from database:', deal);
    console.log('=== END BACKEND CREATE DEBUG ===');

    res.status(201).json(deal);
  } catch (error) {
    console.error('Error creating pizza builder deal:', error);
    res.status(500).json({ error: 'Failed to create pizza builder deal' });
  }
};

// Update pizza builder deal
const updatePizzaBuilderDeal = async (req, res) => {
  try {
    console.log('=== BACKEND UPDATE DEBUG ===');
    console.log('req.body:', req.body);
    console.log('req.body.toppingsData (raw):', req.body.toppingsData);
    
    const { id } = req.params;
    const {
      name,
      description,
      imageUrl,
      maxToppings,
      displayCategoryId,
      availableBases,
      availableSizes,
      toppingsData, // Use toppingsData instead of availableToppings
      mediumPrice,
      largePrice,
      superSizePrice,
      isActive,
    } = req.body;

    // Parse JSON strings from FormData
    const parsedBases = availableBases && typeof availableBases === 'string' ? JSON.parse(availableBases) : availableBases;
    const parsedSizes = availableSizes && typeof availableSizes === 'string' ? JSON.parse(availableSizes) : availableSizes;
    const parsedToppingsData = toppingsData && typeof toppingsData === 'string' ? JSON.parse(toppingsData) : (toppingsData || {});
    const parsedMaxToppings = maxToppings && typeof maxToppings === 'string' ? parseInt(maxToppings, 10) : maxToppings;
    const parsedIsActive = isActive !== undefined && typeof isActive === 'string' ? isActive === 'true' : isActive;

    console.log('Parsed toppingsData for update:', parsedToppingsData);

    // Parse pricing fields - Medium, Large, Super Size
    const parsedMediumPrice = mediumPrice !== undefined ? (mediumPrice ? parseFloat(mediumPrice) : null) : undefined;
    const parsedLargePrice = largePrice !== undefined ? (largePrice ? parseFloat(largePrice) : null) : undefined;
    const parsedSuperSizePrice = superSizePrice !== undefined ? (superSizePrice ? parseFloat(superSizePrice) : null) : undefined;

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
    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(parsedMaxToppings !== undefined && { maxToppings: parsedMaxToppings }),
      ...(displayCategoryId && { displayCategoryId }),
      ...(parsedBases && { availableBases: parsedBases }),
      ...(parsedSizes && { availableSizes: parsedSizes }),
      // Default sauces if not provided
      availableSauces: ['Tomato Sauce', 'BBQ Sauce', 'White Sauce', 'Pesto', 'Garlic Butter'],
      ...(parsedToppingsData && Object.keys(parsedToppingsData).length > 0 && { 
        availableToppings: parsedToppingsData, // Store {id: name} format in availableToppings too
        toppingsData: parsedToppingsData // Store {id: name} format
      }),
      ...(parsedMediumPrice !== undefined && { mediumPrice: parsedMediumPrice }),
      ...(parsedLargePrice !== undefined && { largePrice: parsedLargePrice }),
      ...(parsedSuperSizePrice !== undefined && { superSizePrice: parsedSuperSizePrice }),
      ...(parsedIsActive !== undefined && { isActive: parsedIsActive }),
    };

    console.log('Update data being stored to database:', updateData);

    const updatedDeal = await prisma.pizzaBuilderDeal.update({
      where: { id },
      data: updateData,
      include: {
        displayCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('Updated deal from database:', updatedDeal);
    console.log('=== END BACKEND UPDATE DEBUG ===');

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

// Toggle out of stock status for pizza builder deals
const togglePizzaBuilderOutOfStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOutOfStock } = req.body;

    const pizzaBuilderDeal = await prisma.pizzaBuilderDeal.update({
      where: { id },
      data: { isOutOfStock: Boolean(isOutOfStock) },
    });

    return res.status(200).json({
      success: true,
      message: `Pizza Builder Deal ${isOutOfStock ? 'marked as out of stock' : 'marked as available'}`,
      pizzaBuilderDeal
    });
  } catch (error) {
    console.error("Error updating pizza builder deal out of stock status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export {
  getAllPizzaBuilderDeals,
  getPizzaBuilderDealById,
  createPizzaBuilderDeal,
  updatePizzaBuilderDeal,
  deletePizzaBuilderDeal,
  togglePizzaBuilderDealStatus,
  togglePizzaBuilderOutOfStock,
};
