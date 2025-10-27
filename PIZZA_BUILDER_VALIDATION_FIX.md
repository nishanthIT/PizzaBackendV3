## Pizza Builder Validation Middleware Fix

### Problem:
The validation middleware was trying to validate Pizza Builder items as regular pizzas, causing "Pizza with ID not found" errors because Pizza Builder deals exist in the `pizzaBuilderDeal` table, not the `pizza` table.

### Root Cause:
The frontend was sending Pizza Builder items with:
- `type: "pizza"` 
- `id: "cmgyrcgh90001caso28y6v12e"` (Pizza Builder Deal ID)

But the middleware was looking for this ID in the `pizza` table instead of the `pizzaBuilderDeal` table.

### Solution:
Added Pizza Builder detection and validation in the `validateCartPrices` middleware:

#### 1. Enhanced Debug Logging
- Added `item.isPizzaBuilder` and `item.pizzaBuilderDealId` to debug output
- Shows all relevant fields for troubleshooting

#### 2. Pizza Builder Detection
Detects Pizza Builder items using multiple criteria:
```javascript
item.isPizzaBuilder || 
item.type === 'pizzaBuilder' || 
item.pizzaBuilderDealId || 
(item.type === 'userChoice' && item.selectedItems?.toppings)
```

#### 3. Proper Validation
- Looks up items in `pizzaBuilderDeal` table instead of `pizza` table
- Validates deal exists and is active
- Calculates correct base price for selected size
- Sets proper flags for downstream processing

#### 4. Secure Data Flow
- Validates quantity and pricing
- Sets `isPizzaBuilder: true` flag for cart merge logic
- Preserves all necessary fields for secure processing

### Result:
✅ Pizza Builder items are now properly validated before reaching cart merge
✅ No more "Pizza with ID not found" errors
✅ Proper price validation from Pizza Builder Deal database values
✅ Secure data flow to cart merge logic

The validation middleware now correctly identifies and validates Pizza Builder items, allowing them to proceed to the enhanced cart merge logic for final secure processing.