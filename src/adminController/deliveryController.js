import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all delivery zones
export const getDeliveryZones = async (req, res) => {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: {
        sortOrder: 'asc'
      }
    });
    res.json(zones);
  } catch (error) {
    console.error('Error fetching delivery zones:', error);
    res.status(500).json({ error: 'Failed to fetch delivery zones' });
  }
};

// Get delivery settings
export const getDeliverySettings = async (req, res) => {
  try {
    let settings = await prisma.deliverySettings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.deliverySettings.create({
        data: {
          maxDeliveryDistance: 4,
          isDeliveryEnabled: true
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    res.status(500).json({ error: 'Failed to fetch delivery settings' });
  }
};

// Create a new delivery zone
export const createDeliveryZone = async (req, res) => {
  try {
    const { name, minDistance, maxDistance, charge, isActive, sortOrder } = req.body;
    
    // Validation
    if (!name || minDistance === undefined || maxDistance === undefined || charge === undefined) {
      return res.status(400).json({ error: 'Name, minDistance, maxDistance, and charge are required' });
    }
    
    if (parseFloat(minDistance) >= parseFloat(maxDistance)) {
      return res.status(400).json({ error: 'Minimum distance must be less than maximum distance' });
    }
    
    if (parseFloat(charge) < 0) {
      return res.status(400).json({ error: 'Charge must be non-negative' });
    }
    
    // Check for overlapping zones
    const overlappingZone = await prisma.deliveryZone.findFirst({
      where: {
        OR: [
          {
            AND: [
              { minDistance: { lte: parseFloat(maxDistance) } },
              { maxDistance: { gte: parseFloat(minDistance) } }
            ]
          }
        ],
        isActive: true
      }
    });
    
    if (overlappingZone) {
      return res.status(400).json({ 
        error: `Zone overlaps with existing zone: ${overlappingZone.name}` 
      });
    }
    
    const newZone = await prisma.deliveryZone.create({
      data: {
        name,
        minDistance: parseFloat(minDistance),
        maxDistance: parseFloat(maxDistance),
        charge: parseFloat(charge),
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
      }
    });
    
    res.status(201).json(newZone);
  } catch (error) {
    console.error('Error creating delivery zone:', error);
    res.status(500).json({ error: 'Failed to create delivery zone' });
  }
};

// Update a delivery zone
export const updateDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, minDistance, maxDistance, charge, isActive, sortOrder } = req.body;
    
    const existingZone = await prisma.deliveryZone.findUnique({
      where: { id }
    });
    
    if (!existingZone) {
      return res.status(404).json({ error: 'Delivery zone not found' });
    }
    
    // Validation if distance fields are being updated
    if (minDistance !== undefined && maxDistance !== undefined) {
      if (parseFloat(minDistance) >= parseFloat(maxDistance)) {
        return res.status(400).json({ error: 'Minimum distance must be less than maximum distance' });
      }
      
      // Check for overlapping zones (excluding current zone)
      const overlappingZone = await prisma.deliveryZone.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                {
                  AND: [
                    { minDistance: { lte: parseFloat(maxDistance) } },
                    { maxDistance: { gte: parseFloat(minDistance) } }
                  ]
                }
              ]
            },
            { isActive: true }
          ]
        }
      });
      
      if (overlappingZone) {
        return res.status(400).json({ 
          error: `Zone would overlap with existing zone: ${overlappingZone.name}` 
        });
      }
    }
    
    if (charge !== undefined && parseFloat(charge) < 0) {
      return res.status(400).json({ error: 'Charge must be non-negative' });
    }
    
    const updatedZone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(minDistance !== undefined && { minDistance: parseFloat(minDistance) }),
        ...(maxDistance !== undefined && { maxDistance: parseFloat(maxDistance) }),
        ...(charge !== undefined && { charge: parseFloat(charge) }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });
    
    res.json(updatedZone);
  } catch (error) {
    console.error('Error updating delivery zone:', error);
    res.status(500).json({ error: 'Failed to update delivery zone' });
  }
};

// Delete a delivery zone
export const deleteDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingZone = await prisma.deliveryZone.findUnique({
      where: { id }
    });
    
    if (!existingZone) {
      return res.status(404).json({ error: 'Delivery zone not found' });
    }
    
    await prisma.deliveryZone.delete({
      where: { id }
    });
    
    res.json({ message: 'Delivery zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery zone:', error);
    res.status(500).json({ error: 'Failed to delete delivery zone' });
  }
};

// Update delivery settings
export const updateDeliverySettings = async (req, res) => {
  try {
    const { 
      maxDeliveryDistance, 
      isDeliveryEnabled, 
      shopName, 
      shopAddress, 
      shopLatitude, 
      shopLongitude, 
      shopPhone 
    } = req.body;
    
    if (maxDeliveryDistance !== undefined && parseFloat(maxDeliveryDistance) <= 0) {
      return res.status(400).json({ error: 'Maximum delivery distance must be positive' });
    }
    
    // Get existing settings or create default
    let settings = await prisma.deliverySettings.findFirst();
    
    if (!settings) {
      settings = await prisma.deliverySettings.create({
        data: {
          maxDeliveryDistance: maxDeliveryDistance ? parseFloat(maxDeliveryDistance) : 4,
          isDeliveryEnabled: isDeliveryEnabled !== undefined ? isDeliveryEnabled : true,
          shopName: shopName || null,
          shopAddress: shopAddress || null,
          shopLatitude: shopLatitude ? parseFloat(shopLatitude) : null,
          shopLongitude: shopLongitude ? parseFloat(shopLongitude) : null,
          shopPhone: shopPhone || null
        }
      });
    } else {
      const updateData = {};
      
      if (maxDeliveryDistance !== undefined) {
        updateData.maxDeliveryDistance = parseFloat(maxDeliveryDistance);
      }
      if (isDeliveryEnabled !== undefined) {
        updateData.isDeliveryEnabled = isDeliveryEnabled;
      }
      if (shopName !== undefined) {
        updateData.shopName = shopName;
      }
      if (shopAddress !== undefined) {
        updateData.shopAddress = shopAddress;
      }
      if (shopLatitude !== undefined) {
        updateData.shopLatitude = shopLatitude ? parseFloat(shopLatitude) : null;
      }
      if (shopLongitude !== undefined) {
        updateData.shopLongitude = shopLongitude ? parseFloat(shopLongitude) : null;
      }
      if (shopPhone !== undefined) {
        updateData.shopPhone = shopPhone;
      }
      
      settings = await prisma.deliverySettings.update({
        where: { id: settings.id },
        data: updateData
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    res.status(500).json({ error: 'Failed to update delivery settings' });
  }
};

// Seed default delivery zones (for initial setup)
export const seedDefaultDeliveryZones = async (req, res) => {
  try {
    // Check if zones already exist
    const existingZones = await prisma.deliveryZone.count();
    
    if (existingZones > 0) {
      return res.status(400).json({ error: 'Delivery zones already exist' });
    }
    
    // Create default zones based on current hardcoded values
    const defaultZones = [
      {
        name: 'Zone 1 (0-2 miles)',
        minDistance: 0,
        maxDistance: 2,
        charge: 2.95,
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Zone 2 (2-3 miles)',
        minDistance: 2,
        maxDistance: 3,
        charge: 3.95,
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Zone 3 (3-4 miles)',
        minDistance: 3,
        maxDistance: 4,
        charge: 4.95,
        isActive: true,
        sortOrder: 3
      }
    ];
    
    const createdZones = await prisma.deliveryZone.createMany({
      data: defaultZones
    });
    
    // Create default delivery settings with shop info
    await prisma.deliverySettings.create({
      data: {
        maxDeliveryDistance: 4,
        isDeliveryEnabled: true,
        shopName: "Your Pizza Restaurant",
        shopAddress: "274 Lower Addiscombe Road, Croydon CR0 7AE, UK",
        shopLatitude: 51.3818739,
        shopLongitude: -0.0692967,
        shopPhone: "+44 20 1234 5678"
      }
    });
    
    res.status(201).json({ 
      message: 'Default delivery zones created successfully',
      count: createdZones.count
    });
  } catch (error) {
    console.error('Error seeding delivery zones:', error);
    res.status(500).json({ error: 'Failed to seed delivery zones' });
  }
};