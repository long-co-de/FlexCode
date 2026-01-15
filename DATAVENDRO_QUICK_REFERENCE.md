# DatavendroService Integration Quick Reference

## Quick Summary

The application has been successfully migrated from **3 different service providers** (Vtpass, Wazobi, Husmodata) to a **single unified DatavendroService**.

## What Changed?

### Before Migration
```
AirtimeController → WazobiaService + HusmodataService (with fallback)
DataController → WazobiaService + HusmodataService (with fallback)
CableController → HusmodataService
ElectricityController → WazobiaService + HusmodataService (with fallback)
```

### After Migration
```
AirtimeController → DatavendroService
DataController → DatavendroService
CableController → DatavendroService
ElectricityController → DatavendroService
```

## Service Methods Quick Reference

### Core Methods

| Method | Purpose | Parameters |
|--------|---------|-----------|
| `getBalance()` | Get wallet balance | None |
| `buyAirtime()` | Purchase airtime | `$phone, $network, $amount, $reference, $airtimeType='VTU', $ported=false` |
| `buyData()` | Purchase data plan | `$phone, $network, $planCode, $reference, $ported` |
| `validateMeter()` | Verify meter number | `$meterNumber, $meterType='prepaid'` |
| `validateIUC()` | Verify smart card | `$iucNumber` |
| `payElectricityBill()` | Pay electricity bill | `$meterNumber, $amount, $meterType='prepaid', $reference=''` |
| `subscribeCable()` | Subscribe to cable | `$iucNumber, $amount, $cableProvider='', $reference=''` |

## Network IDs

| Network | Code | ID |
|---------|------|-----|
| MTN | `mtn` | 1 |
| Glo | `glo` | 2 |
| 9Mobile | `9mobile` | 3 |
| Airtel | `airtel` | 4 |

## Response Format

All methods return a consistent response array:

```php
// Success
[
    'success' => true,
    'data' => [...],        // Actual response from API
    'message' => '...'      // Success message
]

// Failure
[
    'success' => false,
    'message' => '...'      // Error message
]
```

## Usage in Controllers

### Airtime Controller Example
```php
$response = $this->datavendroService->buyAirtime(
    '08012345678',           // phone
    'mtn',                   // network
    500,                     // amount
    'AIR7X9K2Q',            // reference
    'VTU',                   // airtimeType
    false                    // ported
);

if ($response['success']) {
    // Handle success
} else {
    // Handle error: $response['message']
}
```

### Data Controller Example
```php
$response = $this->datavendroService->buyData(
    '08012345678',           // phone
    'mtn',                   // network
    'plan_code_123',         // planCode
    'DATA1A2B3C4D',          // reference
    false                    // ported
);
```

### Electricity Controller Example
```php
// First validate
$validation = $this->datavendroService->validateMeter(
    '1234567890',            // meterNumber
    'prepaid'                // meterType
);

if ($validation['success']) {
    // Then process payment
    $response = $this->datavendroService->payElectricityBill(
        '1234567890',         // meterNumber
        5000,                 // amount
        'prepaid',            // meterType
        'ELECX9Y8Z1'         // reference
    );
}
```

### Cable Controller Example
```php
// First validate
$validation = $this->datavendroService->validateIUC('9876543210');

if ($validation['success']) {
    // Then subscribe
    $response = $this->datavendroService->subscribeCable(
        '9876543210',         // iucNumber
        3500,                 // amount
        'dstv',               // cableProvider
        'CABLE2B3C4D'        // reference
    );
}
```

## Common Error Handling

```php
// Generic error handling pattern
$response = $this->datavendroService->someMethod(...);

if ($response['success']) {
    // Update transaction to 'successful'
    $transaction->status = 'successful';
    $transaction->save();
    
    return response()->json([
        'message' => 'Operation successful',
        'transaction' => $transaction,
        'data' => $response['data']
    ]);
} else {
    // Refund user wallet
    $user->wallet_balance += $amount;
    $user->save();
    
    // Update transaction to 'failed'
    $transaction->status = 'failed';
    $transaction->save();
    
    return response()->json([
        'message' => 'Operation failed: ' . $response['message'],
        'transaction' => $transaction
    ], 400);
}
```

## Configuration

The service reads configuration from the `settings` table:

```php
// Retrieve current settings
$apiKey = Setting::where('key', 'datavendro_api_key')->value('value');
$apiUrl = Setting::where('key', 'datavendro_api_url')->value('value');

// Update settings
Setting::updateOrCreate(
    ['key' => 'datavendro_api_key'],
    ['value' => 'new_api_key']
);

Setting::updateOrCreate(
    ['key' => 'datavendro_api_url'],
    ['value' => 'https://api.datavendro.ng/']
);
```

## Dependency Injection

### In Controller Constructor
```php
use App\Services\DatavendroService;

class MyController extends Controller
{
    protected $datavendroService;

    public function __construct(DatavendroService $datavendroService)
    {
        $this->datavendroService = $datavendroService;
    }
}
```

### Using the Service
```php
public function someMethod()
{
    $response = $this->datavendroService->getBalance();
    // Use response...
}
```

## Testing

### Unit Test Example
```php
public function test_airtime_purchase()
{
    $this->actingAs($user);
    
    $response = $this->postJson('/api/airtime/purchase', [
        'network_id' => 1,
        'phone_number' => '08012345678',
        'amount' => 500
    ]);
    
    $response->assertStatus(200)
             ->assertJsonPath('message', 'Airtime purchase successful!');
}
```

## Troubleshooting

### API Connection Issues
1. Verify `datavendro_api_key` setting
2. Verify `datavendro_api_url` setting
3. Check network connectivity
4. Review logs: `storage/logs/laravel.log`

### Transaction Failures
1. Check user's wallet balance
2. Verify input parameters (phone format, meter number, etc.)
3. Check API response in logs
4. Ensure database transaction isolation

### Refund Issues
1. Transaction should be rolled back if API call fails
2. User wallet should be restored automatically
3. Transaction status should be 'failed'
4. Check transaction metadata for error details

## Migration Completed Files

- ✅ `/app/Services/DatavendroService.php` - Enhanced with new methods
- ✅ `/app/Http/Controllers/Api/AirtimeController.php` - Migrated
- ✅ `/app/Http/Controllers/Api/DataController.php` - Migrated
- ✅ `/app/Http/Controllers/Api/CableController.php` - Migrated
- ✅ `/app/Http/Controllers/Api/ElectricityController.php` - Migrated
- ✅ `/DATAVENDRO_MIGRATION.md` - Full migration documentation
- ✅ `/DATAVENDRO_TEST_EXAMPLES.php` - Test examples and curl commands

## Old Services (No Longer Used)

These services are still in the codebase but are **not used** anymore:
- `VtpassService` - Can be archived or deleted
- `WazobiaService` - Can be archived or deleted
- `HusmodataService` - Can be archived or deleted

Consider removing them in a future cleanup cycle.

## Next Steps

1. **Test all functionality** using provided test examples
2. **Monitor logs** for API errors during initial deployment
3. **Update documentation** if there are custom implementations
4. **Remove old services** once confident with the migration
5. **Consider caching** data plans for better performance

## Support

For issues or questions:
1. Check `DATAVENDRO_MIGRATION.md` for detailed documentation
2. Review `DATAVENDRO_TEST_EXAMPLES.php` for usage patterns
3. Check Laravel logs: `storage/logs/laravel.log`
4. Verify API credentials and endpoints

---

**Migration Date:** January 2, 2026  
**API Provider:** Datavendro (https://datavendor.ng/)  
**Status:** ✅ Complete and Testing Ready
