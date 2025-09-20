import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        points: true,
        created_at: true,
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            deliveryMethod: true,
            customerName: true,
            orderItems: {
              select: {
                pizza: {
                  select: { name: true }
                },
                otherItem: {
                  select: { name: true }
                },
                combo: {
                  select: { name: true }
                },
                periPeri: {
                  select: { name: true }
                },
                comboStyleItem: {
                  select: { name: true }
                },
                quantity: true,
                price: true,
                size: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedCustomers = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

      return {
        id: customer.id,
        name: customer.name || customer.phone, // Fallback to phone if no name
        email: customer.email || `${customer.phone}@phone.user`, // Generate email if not exists
        phone: customer.phone,
        rewardPoints: Number(customer.points) || 0,
        totalOrders: customer.orders.length,
        totalSpent: totalSpent,
        joinDate: customer.created_at,
        orders: customer.orders.map(order => {
          const orderItems = order.orderItems.map(item => {
            const itemName = item.pizza?.name ||
              item.otherItem?.name ||
              item.combo?.name ||
              item.periPeri?.name ||
              item.comboStyleItem?.name ||
              'Unknown Item';
            return `${itemName} (${item.size}) x${item.quantity}`;
          }).join(', ');

          return {
            id: order.id,
            date: order.createdAt.toISOString().split('T')[0],
            items: orderItems,
            total: `£${Number(order.totalAmount).toFixed(2)}`,
            pointsEarned: Math.floor(Number(order.totalAmount) * 0.10),
            status: order.status
          };
        })
      };
    });

    res.json({
      success: true,
      customers: formattedCustomers
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                pizza: true,
                otherItem: true,
                combo: true,
                periPeri: true,
                comboStyleItem: true,
                orderToppings: true,
                orderIngredients: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const formattedCustomer = {
      id: customer.id,
      name: customer.name || customer.phone,
      email: customer.email || `${customer.phone}@phone.user`,
      phone: customer.phone,
      address: customer.address || 'Not specified',
      rewardPoints: Number(customer.points) || 0,
      joinDate: customer.created_at,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      orders: customer.orders.map(order => ({
        id: order.id,
        date: order.createdAt.toISOString().split('T')[0],
        items: order.orderItems.map(item => {
          // Debug: Log key fields only
          console.log(`Item IDs - Pizza: ${item.pizzaId}, Other: ${item.otherItemId}, Combo: ${item.comboId}, PeriPeri: ${item.periPeriId}, ComboStyle: ${item.comboStyleItemId}`);

          // Try to get item name from various sources
          let itemName = 'Unknown Item';

          if (item.pizza?.name) {
            itemName = item.pizza.name;
          } else if (item.otherItem?.name) {
            itemName = item.otherItem.name;
          } else if (item.combo?.name) {
            itemName = item.combo.name;
          } else if (item.periPeri?.name) {
            itemName = item.periPeri.name;
          } else if (item.comboStyleItem?.name) {
            itemName = item.comboStyleItem.name;
          } else {
            // Log when we can't find the name
            console.log(`⚠️  Could not find item name for item with size: ${item.size}, IDs: pizza=${item.pizzaId}, other=${item.otherItemId}, combo=${item.comboId}, periPeri=${item.periPeriId}, comboStyle=${item.comboStyleItemId}`);

            // Try to construct a meaningful name based on available info
            if (item.comboStyleItemId) {
              itemName = 'ComboStyle Item (Missing)';
            } else if (item.periPeriId) {
              itemName = 'PeriPeri Item (Missing)';
            } else if (item.pizzaId) {
              itemName = 'Pizza (Missing)';
            } else if (item.otherItemId) {
              itemName = 'Other Item (Missing)';
            } else if (item.comboId) {
              itemName = 'Combo (Missing)';
            }
          }

          return `${itemName} (${item.size}) x${item.quantity}`;
        }).join(', '),
        total: `£${Number(order.totalAmount).toFixed(2)}`,
        pointsEarned: Math.floor(Number(order.totalAmount) * 0.10),
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        pickupTime: order.pickupTime
      }))
    };

    res.json({
      success: true,
      customer: formattedCustomer
    });

  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, phone } = req.body;

    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
        address: address || undefined,
        phone: phone || undefined
      }
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        address: updatedCustomer.address,
        rewardPoints: Number(updatedCustomer.points)
      }
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // First delete all related orders and their items
    await prisma.order.deleteMany({
      where: { userId: id }
    });

    // Delete cart items
    await prisma.cart.deleteMany({
      where: { userId: id }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

// Get customer statistics
export const getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await prisma.user.count();

    const totalOrders = await prisma.order.count();

    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    });

    const totalPointsDistributed = await prisma.user.aggregate({
      _sum: {
        points: true
      }
    });

    const topCustomers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        points: true,
        orders: {
          select: {
            totalAmount: true
          }
        }
      },
      take: 5,
      orderBy: {
        points: 'desc'
      }
    });

    const formattedTopCustomers = topCustomers.map(customer => ({
      id: customer.id,
      name: customer.name || customer.phone,
      points: Number(customer.points),
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    }));

    res.json({
      success: true,
      stats: {
        totalCustomers,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount) || 0,
        totalPointsDistributed: Number(totalPointsDistributed._sum.points) || 0,
        topCustomers: formattedTopCustomers
      }
    });

  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error.message
    });
  }
};