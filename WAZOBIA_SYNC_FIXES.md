# WazobiaSyncCommand Fixes - Summary

**Date:** January 2, 2026  
**Issue:** The `php artisan wazobia:sync` command was failing due to database schema and model configuration errors.

## Problems Identified and Fixed

### 1. **Incorrect Column Name: `status` → `is_active`**
**File:** `app/Console/Commands/WazobiaSyncCommand.php`

**Issue:** The command was trying to set a `status` column that doesn't exist in several tables.

**Database Schema Reality:**
- `networks` table uses `is_active`
- `cable_providers` table uses `is_active`
- `electricity_providers` table uses `is_active`
- `cable_plans` table uses `is_active`

**Fix:** Changed all occurrences of `'status' => true` to `'is_active' => true`

Affected methods:
- `syncNetworks()` - line 66
- `syncCableProviders()` - line 141
- `syncElectricityProviders()` - line 197

---

### 2. **Missing Required Field: `selling_price` in Data Plans**
**File:** `app/Console/Commands/WazobiaSyncCommand.php`

**Issue:** The data plan sync was setting `price => 0` but not including `selling_price`, which is a required field.

**Fix:** Updated the data plans sync to include both:
```php
'price' => $planData['price'] ?? 0,
'selling_price' => $planData['price'] ?? 0,
```

---

### 3. **Incorrect Column Names in Cable Plans**
**File:** `app/Console/Commands/WazobiaSyncCommand.php`

**Issue:** The cable plans sync was using `amount` instead of `price` and `selling_price`.

**Database Reality:** Cable plans table has columns: `price`, `selling_price`, `validity` (not `amount`)

**Fix:** Updated cable plan sync to use correct column names:
```php
'price' => $planData['price'] ?? 0,
'selling_price' => $planData['price'] ?? 0,
'validity' => $planData['validity'] ?? '1 month',
'wazobia_price' => $planData['price'] ?? 0,
```

---

### 4. **Migration Reference Error**
**File:** `database/migrations/2025_12_06_141500_add_wazobia_fields_to_cable_plans_table.php`

**Issue:** The migration was trying to add a column `after('amount')` but the column doesn't exist.

**Fix:** Changed to use the correct reference column:
```php
// Before:
$table->decimal('wazobia_price', 12, 2)->nullable()->after('amount');

// After:
$table->decimal('wazobia_price', 12, 2)->nullable()->after('selling_price');
```

Also added idempotency checks for columns that already exist:
```php
if (!Schema::hasColumn('cable_plans', 'product_code')) {
    $table->string('product_code')->nullable()->after('code');
}
if (!Schema::hasColumn('cable_plans', 'wazobia_price')) {
    $table->decimal('wazobia_price', 12, 2)->nullable()->after('selling_price');
}
```

---

### 5. **Model $fillable Array Missing Required Fields**
**File:** `app/Models/CablePlan.php`

**Issue:** The CablePlan model's `$fillable` array was missing several fields:
- Missing: `price`, `selling_price`, `validity`, `is_active`
- Wrong: Had `amount` and `status` (which don't exist or aren't used)

**Fix:** Updated the $fillable array:
```php
protected $fillable = [
    'cable_provider_id',
    'name',
    'code',
    'product_code',
    'price',           // Added
    'selling_price',   // Added
    'validity',        // Added
    'wazobia_price',
    'is_active',       // Added
];
```

---

## Test Results

After all fixes, the command runs successfully:

```
Starting Wazobia data synchronization...
Syncing networks...
✓ Synced 4 networks
Syncing data plans...
  • MTN: 24 plans
  • AIRTEL: 9 plans
  • GLO: 7 plans
  • 9MOBILE: 11 plans
✓ Synced 51 data plans
Syncing cable providers and plans...
  • DStv: 6 plans
  • GoTV: 5 plans
  • Startimes: 9 plans
  • Showmax: 3 plans
✓ Synced 4 cable providers with 23 plans
Syncing electricity providers...
✓ Synced 11 electricity providers
✓ Wazobia data synchronization completed successfully!
```

---

## Files Modified

1. ✅ `app/Console/Commands/WazobiaSyncCommand.php`
   - Fixed column names (status → is_active)
   - Fixed field mappings in all sync methods
   - Improved cable plan sync logic

2. ✅ `database/migrations/2025_12_06_141500_add_wazobia_fields_to_cable_plans_table.php`
   - Fixed column reference (amount → selling_price)
   - Added idempotency checks

3. ✅ `app/Models/CablePlan.php`
   - Updated $fillable array with correct fields

---

## Database Schema Summary

**Networks Table:**
- `id`, `name`, `code`, `logo`, `is_active`, `timestamps`

**Cable Providers Table:**
- `id`, `name`, `code`, `logo`, `is_active`, `timestamps`

**Cable Plans Table:**
- `id`, `cable_provider_id`, `name`, `code`, `product_code`, `price`, `selling_price`, `validity`, `is_active`, `wazobia_price`, `timestamps`

**Data Plans Table:**
- `id`, `network_id`, `name`, `code`, `price`, `selling_price`, `validity`, `data_amount`, `is_active`, `dataplan_id`, `plan_type`, `last_api_update`, `timestamps`

**Electricity Providers Table:**
- `id`, `name`, `code`, `logo`, `is_active`, `wazobia_code`, `timestamps`

---

## Notes for Future Maintenance

1. Always verify table schema before writing sync commands
2. Use model `$fillable` arrays correctly - they define what can be mass-assigned
3. Test migrations with existing data to catch issues early
4. Use `Schema::hasColumn()` checks for idempotent migrations
5. Consider using Laravel's built-in model validation for better error messages

---

## Next Steps (Recommendations)

1. ✅ Run `php artisan wazobia:sync` regularly to keep data fresh
2. Consider adding this to a scheduled task in `app/Console/Kernel.php`
3. Monitor the command logs for any API changes
4. Update selling prices regularly based on margin settings
5. Implement error handling for API outages

---

**Status:** ✅ FIXED AND TESTED
