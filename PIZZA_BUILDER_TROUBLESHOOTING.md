# Pizza Builder Cart Merging Troubleshooting Guide

## Current Issue
Database connection error preventing cart merging for Pizza Builder items.

## Error Analysis
```
Can't reach database server at `ep-orange-dawn-abt0kmo1-pooler.eu-west-2.aws.neon.tech:5432`
```

## Resolution Steps

### 1. Database Connection Issues
The primary issue is database connectivity to Neon PostgreSQL:

**Immediate Actions:**
- Check Neon database status at console.neon.tech
- Verify DATABASE_URL in .env file
- Check if database is paused/suspended (common with Neon free tier)

**Test Connection:**
```bash
node src/utils/testDatabaseConnection.js
```

### 2. Missing Database Schema Fields
After connection is restored, ensure Pizza Builder fields exist:

**Run Migration:**
```sql
-- Execute this in your database console or via Prisma
ALTER TABLE "CartItem" 
ADD COLUMN IF NOT EXISTS "additionalToppingCost" DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxToppings" INTEGER DEFAULT 4;
```

**Or use Prisma:**
```bash
npx prisma migrate deploy
```

### 3. Pizza Builder Validation Features Added

**Cart Merge Enhancements:**
- ✅ Topping limit validation (default: 4 toppings)
- ✅ Extra topping cost calculation with size multipliers
- ✅ Security validation for all selected toppings
- ✅ Price tampering protection
- ✅ Smart item matching for Pizza Builder items

**Example Pizza Builder Item:**
```javascript
{
  type: 'userChoice',
  id: 'pizza-builder-id',
  size: 'Large',
  maxToppings: 4,
  selectedItems: {
    toppings: [
      {id: 'topping1'}, {id: 'topping2'}, {id: 'topping3'}, {id: 'topping4'}, // Included
      {id: 'topping5'}, {id: 'topping6'}  // Extra - charged based on size
    ]
  },
  basePrice: 12.99
}
```

**Validation Logic:**
- Base price: £12.99 (from database)
- Extra toppings: 2 (6 selected - 4 included)
- Size multiplier: 1.5x for Large
- Extra cost: 2 × £1.50 × 1.5 = £4.50
- Total: £17.49

### 4. Error Handling Improvements

**Enhanced Error Messages:**
- Database connection errors with retry suggestions
- Schema validation with migration instructions
- Pizza Builder validation with specific error types
- Development vs production error details

### 5. Testing After Database Restoration

1. **Test basic connection:**
   ```bash
   node src/utils/testDatabaseConnection.js
   ```

2. **Test Pizza Builder cart merge:**
   - Add Pizza Builder item with 4 toppings (should work at base price)
   - Add Pizza Builder item with 6 toppings (should calculate extra cost)
   - Verify size-based pricing for extra toppings

3. **Verify database fields:**
   - Check CartItem table has new fields
   - Test cart merging with various combinations

## Database Schema Updates Required

```sql
-- New fields in CartItem table
additionalToppingCost  DECIMAL  DEFAULT 0   -- Extra topping costs
maxToppings           INTEGER  DEFAULT 4    -- Topping limit reference
```

## Next Steps When Database is Available

1. Restore database connection
2. Run migration to add Pizza Builder fields
3. Test cart merging with Pizza Builder items
4. Verify price calculations for extra toppings
5. Test with different sizes (Medium, Large, Super Size)

## Contact/Support
- Check Neon database console for service status
- Verify connection pooling settings
- Consider upgrading Neon plan if hitting connection limits