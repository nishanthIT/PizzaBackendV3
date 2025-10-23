import prisma from './src/lib/prisma.js';

async function checkOrder() {
  try {
    // Check the specific order mentioned by user
    const order = await prisma.order.findUnique({
      where: { id: 'cmh2ebcpy002bcabk4y5gsc9c' },
      include: {
        orderItems: {
          select: {
            id: true,
            pizzaId: true,
            comboId: true,
            isCombo: true,
            quantity: true,
            pizzaBuilderDealId: true
          }
        }
      }
    });

    console.log('Order data:', JSON.stringify(order, null, 2));

    if (order && order.orderItems) {
      console.log('\n--- Order Items Analysis ---');
      order.orderItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item.id,
          type: item.pizzaId ? 'Pizza' : item.comboId ? 'Combo' : 'Other',
          isPizzaBuilder: !!item.pizzaBuilderDealId,
          pizzaId: item.pizzaId,
          comboId: item.comboId,
          pizzaBuilderDealId: item.pizzaBuilderDealId,
          quantity: item.quantity
        });
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrder();