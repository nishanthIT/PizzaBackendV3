import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function restoreDataWithNewSizes() {
    try {
        console.log('🍕 Starting data restoration with new size structure...');

        // Create categories first
        const categories = [
            { name: 'Classic Pizzas', description: 'Traditional favorites' },
            { name: 'Specialty Pizzas', description: 'Chef\'s special creations' },
            { name: 'Vegetarian', description: 'Meat-free options' }
        ];

        console.log('📁 Creating categories...');
        for (const category of categories) {
            const existing = await prisma.category.findFirst({
                where: { name: category.name }
            });
            
            if (!existing) {
                await prisma.category.create({
                    data: category
                });
            }
        }

        // Create some toppings
        const toppings = [
            { name: 'Extra Cheese', price: 2.50 },
            { name: 'Pepperoni', price: 3.00 },
            { name: 'Mushrooms', price: 2.00 },
            { name: 'Bell Peppers', price: 2.00 },
            { name: 'Italian Sausage', price: 3.50 },
            { name: 'Olives', price: 2.50 }
        ];

        console.log('🧄 Creating toppings...');
        for (const topping of toppings) {
            const existing = await prisma.toppingsList.findFirst({
                where: { name: topping.name }
            });
            
            if (!existing) {
                await prisma.toppingsList.create({
                    data: topping
                });
            }
        }

        // Create ingredients
        const ingredients = [
            { name: 'Mozzarella Cheese', price: 0.00 },
            { name: 'Tomato Sauce', price: 0.00 },
            { name: 'Fresh Basil', price: 1.00 },
            { name: 'Oregano', price: 0.50 },
            { name: 'Garlic', price: 0.50 }
        ];

        console.log('🌿 Creating ingredients...');
        for (const ingredient of ingredients) {
            const existing = await prisma.ingredientsList.findFirst({
                where: { name: ingredient.name }
            });
            
            if (!existing) {
                await prisma.ingredientsList.create({
                    data: ingredient
                });
            }
        }

        // Get created data
        const createdCategories = await prisma.category.findMany();
        const createdToppings = await prisma.toppingsList.findMany();
        const createdIngredients = await prisma.ingredientsList.findMany();

        const classicCategory = createdCategories.find(c => c.name === 'Classic Pizzas');
        const specialtyCategory = createdCategories.find(c => c.name === 'Specialty Pizzas');
        const vegetarianCategory = createdCategories.find(c => c.name === 'Vegetarian');

        // Create pizzas with new size structure (MEDIUM/LARGE/SUPER_SIZE)
        const pizzas = [
            {
                name: 'Margherita',
                description: 'Classic pizza with fresh mozzarella, tomatoes, and basil',
                categoryId: classicCategory.id,
                // New size structure: Medium/Large/Super Size
                sizes: JSON.stringify({
                    MEDIUM: 12.99,
                    LARGE: 16.99,
                    SUPER_SIZE: 21.99
                }),
                imageUrl: 'margherita.jpg'
            },
            {
                name: 'Pepperoni Classic',
                description: 'Traditional pepperoni pizza with mozzarella cheese',
                categoryId: classicCategory.id,
                sizes: JSON.stringify({
                    MEDIUM: 14.99,
                    LARGE: 18.99,
                    SUPER_SIZE: 23.99
                }),
                imageUrl: 'pepperoni.jpg'
            },
            {
                name: 'Supreme Deluxe',
                description: 'Loaded with pepperoni, sausage, peppers, mushrooms, and olives',
                categoryId: specialtyCategory.id,
                sizes: JSON.stringify({
                    MEDIUM: 17.99,
                    LARGE: 22.99,
                    SUPER_SIZE: 28.99
                }),
                imageUrl: 'supreme.jpg'
            },
            {
                name: 'Vegetarian Garden',
                description: 'Fresh vegetables including bell peppers, mushrooms, olives, and onions',
                categoryId: vegetarianCategory.id,
                sizes: JSON.stringify({
                    MEDIUM: 15.99,
                    LARGE: 19.99,
                    SUPER_SIZE: 25.99
                }),
                imageUrl: 'vegetarian.jpg'
            },
            {
                name: 'Hawaiian Paradise',
                description: 'Ham and pineapple with mozzarella cheese',
                categoryId: specialtyCategory.id,
                sizes: JSON.stringify({
                    MEDIUM: 16.99,
                    LARGE: 21.99,
                    SUPER_SIZE: 27.99
                }),
                imageUrl: 'hawaiian.jpg'
            }
        ];

        console.log('🍕 Creating pizzas with new size structure...');
        const createdPizzas = [];
        for (const pizza of pizzas) {
            const createdPizza = await prisma.pizza.create({
                data: pizza
            });
            createdPizzas.push(createdPizza);
            console.log(`✅ Created: ${pizza.name} - Medium: £${JSON.parse(pizza.sizes).MEDIUM}, Large: £${JSON.parse(pizza.sizes).LARGE}, Super Size: £${JSON.parse(pizza.sizes).SUPER_SIZE}`);
        }

        // Add default toppings to some pizzas
        console.log('🧄 Adding default toppings...');
        const extraCheese = createdToppings.find(t => t.name === 'Extra Cheese');
        const pepperoni = createdToppings.find(t => t.name === 'Pepperoni');
        const mushrooms = createdToppings.find(t => t.name === 'Mushrooms');
        const peppers = createdToppings.find(t => t.name === 'Bell Peppers');
        const sausage = createdToppings.find(t => t.name === 'Italian Sausage');
        const olives = createdToppings.find(t => t.name === 'Olives');

        const margherita = createdPizzas.find(p => p.name === 'Margherita');
        const pepperoniPizza = createdPizzas.find(p => p.name === 'Pepperoni Classic');
        const supreme = createdPizzas.find(p => p.name === 'Supreme Deluxe');
        const vegetarian = createdPizzas.find(p => p.name === 'Vegetarian Garden');

        // Add default toppings
        if (pepperoniPizza && pepperoni) {
            await prisma.defaultToppings.create({
                data: {
                    pizzaId: pepperoniPizza.id,
                    toppingId: pepperoni.id,
                    name: pepperoni.name,
                    price: pepperoni.price,
                    quantity: 1,
                    include: true
                }
            });
        }

        if (supreme) {
            const supremeToppings = [
                { topping: pepperoni, quantity: 1 },
                { topping: sausage, quantity: 1 },
                { topping: peppers, quantity: 1 },
                { topping: mushrooms, quantity: 1 },
                { topping: olives, quantity: 1 }
            ];
            
            for (const { topping, quantity } of supremeToppings) {
                if (topping) {
                    await prisma.defaultToppings.create({
                        data: {
                            pizzaId: supreme.id,
                            toppingId: topping.id,
                            name: topping.name,
                            price: topping.price,
                            quantity,
                            include: true
                        }
                    });
                }
            }
        }

        if (vegetarian) {
            const vegToppings = [
                { topping: peppers, quantity: 1 },
                { topping: mushrooms, quantity: 1 },
                { topping: olives, quantity: 1 }
            ];
            
            for (const { topping, quantity } of vegToppings) {
                if (topping) {
                    await prisma.defaultToppings.create({
                        data: {
                            pizzaId: vegetarian.id,
                            toppingId: topping.id,
                            name: topping.name,
                            price: topping.price,
                            quantity,
                            include: true
                        }
                    });
                }
            }
        }

        // Add default ingredients
        console.log('🌿 Adding default ingredients...');
        const mozzarella = createdIngredients.find(i => i.name === 'Mozzarella Cheese');
        const tomatoSauce = createdIngredients.find(i => i.name === 'Tomato Sauce');
        const basil = createdIngredients.find(i => i.name === 'Fresh Basil');

        for (const pizza of createdPizzas) {
            // All pizzas get mozzarella and tomato sauce
            if (mozzarella) {
                await prisma.defaultIngredients.create({
                    data: {
                        pizzaId: pizza.id,
                        ingredientId: mozzarella.id,
                        name: mozzarella.name,
                        price: mozzarella.price,
                        quantity: 1,
                        include: true
                    }
                });
            }
            
            if (tomatoSauce) {
                await prisma.defaultIngredients.create({
                    data: {
                        pizzaId: pizza.id,
                        ingredientId: tomatoSauce.id,
                        name: tomatoSauce.name,
                        price: tomatoSauce.price,
                        quantity: 1,
                        include: true
                    }
                });
            }
            
            // Margherita gets basil
            if (pizza.name === 'Margherita' && basil) {
                await prisma.defaultIngredients.create({
                    data: {
                        pizzaId: pizza.id,
                        ingredientId: basil.id,
                        name: basil.name,
                        price: basil.price,
                        quantity: 1,
                        include: true
                    }
                });
            }
        }

        // Create some other items (non-pizza)
        console.log('🥤 Creating other items...');
        
        // First create categories for other items
        const otherItemCategories = [
            { name: 'Drinks', description: 'Beverages' },
            { name: 'Sides', description: 'Side dishes' },
            { name: 'Desserts', description: 'Sweet treats' }
        ];
        
        for (const category of otherItemCategories) {
            const existing = await prisma.category.findFirst({
                where: { name: category.name }
            });
            
            if (!existing) {
                await prisma.category.create({
                    data: category
                });
            }
        }
        
        // Get all categories including the new ones
        const allCategories = await prisma.category.findMany();
        const drinksCategory = allCategories.find(c => c.name === 'Drinks');
        const sidesCategory = allCategories.find(c => c.name === 'Sides');
        const dessertsCategory = allCategories.find(c => c.name === 'Desserts');
        
        const otherItems = [
            {
                name: 'Coca Cola 330ml',
                description: 'Refreshing cola drink',
                price: 2.50,
                categoryId: drinksCategory.id,
                imageUrl: 'coke.jpg'
            },
            {
                name: 'Garlic Bread',
                description: 'Crispy bread with garlic butter',
                price: 4.99,
                categoryId: sidesCategory.id,
                imageUrl: 'garlic-bread.jpg'
            },
            {
                name: 'Chicken Wings (8 pieces)',
                description: 'Spicy buffalo chicken wings',
                price: 8.99,
                categoryId: sidesCategory.id,
                imageUrl: 'wings.jpg'
            },
            {
                name: 'Chocolate Brownie',
                description: 'Rich chocolate brownie with vanilla ice cream',
                price: 5.99,
                categoryId: dessertsCategory.id,
                imageUrl: 'brownie.jpg'
            }
        ];

        for (const item of otherItems) {
            await prisma.otherItem.create({
                data: item
            });
            console.log(`✅ Created other item: ${item.name} - £${item.price}`);
        }

        // Verify the data
        console.log('\n📊 Data restoration summary:');
        const totalPizzas = await prisma.pizza.count();
        const totalCategories = await prisma.category.count();
        const totalToppings = await prisma.toppingsList.count();
        const totalIngredients = await prisma.ingredientsList.count();
        const totalOtherItems = await prisma.otherItem.count();

        console.log(`✅ ${totalCategories} categories`);
        console.log(`✅ ${totalPizzas} pizzas with new size structure (MEDIUM/LARGE/SUPER_SIZE)`);
        console.log(`✅ ${totalToppings} toppings`);
        console.log(`✅ ${totalIngredients} ingredients`);
        console.log(`✅ ${totalOtherItems} other items`);

        // Display the pizza sizes to verify
        console.log('\n🍕 Pizza size verification:');
        const allPizzas = await prisma.pizza.findMany();
        for (const pizza of allPizzas) {
            const sizes = JSON.parse(pizza.sizes);
            console.log(`${pizza.name}:`);
            console.log(`  Medium: £${sizes.MEDIUM}`);
            console.log(`  Large: £${sizes.LARGE}`);
            console.log(`  Super Size: £${sizes.SUPER_SIZE}`);
        }

        console.log('\n🎉 Data restoration completed successfully with new size structure!');
        console.log('✅ All pizza sizes changed from Small/Medium/Large to Medium/Large/Super Size');
        
    } catch (error) {
        console.error('❌ Error during data restoration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the restoration
restoreDataWithNewSizes()
    .catch(console.error);
