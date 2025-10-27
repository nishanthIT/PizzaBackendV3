import prisma from "../lib/prisma.js";

// Get the special offer (there should be only one active offer at a time)
export const getSpecialOffer = async (req, res) => {
  try {
    const offer = await prisma.specialOffer.findFirst({
      orderBy: { createdAt: 'desc' } // Get the most recent one
    });

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error fetching special offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch special offer',
      error: error.message
    });
  }
};

// Get active special offer for public display
export const getActiveSpecialOffer = async (req, res) => {
  try {
    const offer = await prisma.specialOffer.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error fetching active special offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active special offer',
      error: error.message
    });
  }
};

// Create or update special offer
export const createSpecialOffer = async (req, res) => {
  try {
    const { title, offerText, price, description, orderUrl, isActive } = req.body;

    // Validate required fields
    if (!title || !offerText || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, offer text, and price are required'
      });
    }

    // Check if there's already an active offer and deactivate it if creating a new active one
    if (isActive) {
      await prisma.specialOffer.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const offer = await prisma.specialOffer.create({
      data: {
        title,
        offerText,
        price,
        description: description || null,
        orderUrl: orderUrl || null,
        isActive: Boolean(isActive)
      }
    });

    res.json({
      success: true,
      message: 'Special offer created successfully',
      data: offer
    });
  } catch (error) {
    console.error('Error creating special offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create special offer',
      error: error.message
    });
  }
};

// Update special offer
export const updateSpecialOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, offerText, price, description, orderUrl, isActive } = req.body;

    // Validate required fields
    if (!title || !offerText || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title, offer text, and price are required'
      });
    }

    // Check if there's already an active offer and deactivate it if making this one active
    if (isActive) {
      await prisma.specialOffer.updateMany({
        where: { 
          isActive: true,
          id: { not: id } // Don't deactivate the current one being updated
        },
        data: { isActive: false }
      });
    }

    const offer = await prisma.specialOffer.update({
      where: { id },
      data: {
        title,
        offerText,
        price,
        description: description || null,
        orderUrl: orderUrl || null,
        isActive: Boolean(isActive)
      }
    });

    res.json({
      success: true,
      message: 'Special offer updated successfully',
      data: offer
    });
  } catch (error) {
    console.error('Error updating special offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update special offer',
      error: error.message
    });
  }
};

// Delete special offer
export const deleteSpecialOffer = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.specialOffer.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Special offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting special offer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete special offer',
      error: error.message
    });
  }
};