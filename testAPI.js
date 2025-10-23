import fetch from 'node-fetch';

async function testPizzaBuilderAPI() {
  try {
    const response = await fetch('http://localhost:3003/api/getPizzaBuilderDeals');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('Pizza Builder Deals from API:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if maxToppings is included in the response
    if (Array.isArray(data)) {
      data.forEach((deal, index) => {
        console.log(`\nDeal ${index + 1}: ${deal.name}`);
        console.log(`- maxToppings: ${deal.maxToppings}`);
        console.log(`- isActive: ${deal.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPizzaBuilderAPI();