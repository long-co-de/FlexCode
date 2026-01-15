🔏
XIXAPAY

Search...
Ctrl
K
xixapay
👋
Xixapay API Overview
Authentication
💡
Authentication Guide
Error
😠
Error Codes & Troubleshooting
Service
🏘️
Virtual Account
✨
Create Virtual Account
👩‍❤️‍💋‍👨
Update Virtual Account
🔏
Notification (Webhook)
Powered by GitBook
Partners Bank Code.
Request Headers
Request Body
Response Body



Service
🏘️
Virtual Account
✨
Create Virtual Account
Post https://api.xixapay.com/api/v1/createVirtualAccount

Partners Bank Code.
Bank Code
Bank Name
20867

Palmpay

20889

WEMA

20876

9PSB

Request Headers
Authorization

Beaerer {Secrete_KEY}

api-key

{API_KEY}

Content-Type

application/json

Copy
// header sample
const headers = {
  'Authorization': ⁠ Bearer ${apiSecret} ⁠, // Add your Bearer token
  'Content-Type': 'application/json',
  'api-key': apiKey, // Your API key
};
Request Body
email

{customer_email}

name

{customer_name}

phoneNumber

{customer_phone_number}

bankCode

["20867","20889"]

businessId

{business_id} from the developer page

Copy
// request body sample
const data = {
  email: {customer_email},
  name: {customer_name,
  phoneNumber: {customer_phone_number},
  bankCode: ["20867","20889"],
  businessId: {my_business_id},
};
Response Body
Copy
// response sample
{
    "status": "success",
    "message": "Customer account created successfully. Bank account(s) processed and ready for use.",
    "customer": {
        "customer_id": "fa6aa77cbc60ee04c67f5b7d56394733ed67b924",
        "customer_name": "a",
        "customer_email": "ad.com",
        "customer_phone_number": "07"
    },
    "business": {
        "business_name": "Av",
        "business_email": "a",
        "business_phone_number": "07018",
        "business_Id": null
    },
    "bankAccounts": [
        {
            "bankCode": "20867",
            "accountNumber": "6698059290",
            "accountName": "A(xixapay)",
            "bankName": "Palmpay",
            "Reserved_Account_Id": "3a28cfe332ccf8596bd454584"
        },
         {
            "bankCode": "20889",
            "accountNumber": "6698059290",
            "accountName": "A(wema)",
            "bankName": "Wema",
            "Reserved_Account_Id": "3a28cfe332ccf8596bd374bc4616ad26"
        }
    ],
    "errors": []
}
Previous
Virtual Account
Next
Update Virtual Account
Last updated 4 months ago

Create Virtual Account | XIXAPAY