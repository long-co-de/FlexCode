# VTU Application

A comprehensive Virtual Top-Up (VTU) application built with Laravel and Inertia.js with React. This application allows users to purchase airtime, data, cable TV subscriptions, and pay electricity bills.

## Features

- User authentication and authorization
- Admin dashboard with comprehensive statistics
- User dashboard with quick access to services
- Airtime purchase for all major networks
- Data bundle purchase for all major networks
- Cable TV subscription (DStv, GOtv, Startimes)
- Electricity bill payment
- Wallet system for transactions
- Transaction history and tracking
- Referral system
- Admin management of users, transactions, and services
- Profit margin settings for different services
- Integration with Husmodata API for airtime and data services

## Requirements

- PHP 8.1 or higher
- Composer
- Node.js and NPM
- MySQL or any other database supported by Laravel

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vtu-app.git
cd vtu-app
```

2. Install PHP dependencies:
```bash
composer install
```

3. Install JavaScript dependencies:
```bash
npm install
```

4. Create a copy of the .env file:
```bash
cp .env.example .env
```

5. Generate an application key:
```bash
php artisan key:generate
```

6. Configure your database in the .env file:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vtu_app
DB_USERNAME=root
DB_PASSWORD=
```

7. Run the migrations and seed the database:
```bash
php artisan migrate --seed
```

8. Build the frontend assets:
```bash
npm run dev
```

9. Start the development server:
```bash
php artisan serve
```

10. Visit http://localhost:8000 in your browser.

## Default Users

After seeding the database, you can log in with the following credentials:

- Admin User:
  - Email: admin@example.com
  - Password: password

- Test User:
  - Email: user@example.com
  - Password: password

## API Integration

This application is designed to work with the Husmodata API for airtime and data services. You need to set up your API key in the admin settings.

1. Log in as an admin
2. Go to Settings > API Settings
3. Enter your Husmodata API key and save

## Scheduled Tasks

The application includes several scheduled tasks:

- Daily sync of data plans from the API
- Daily update of selling prices based on profit margins
- Regular check of pending transactions

To run the scheduler, add the following Cron entry to your server:

```
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Customizing Profit Margins

As an admin, you can customize the profit margins for different services:

1. Log in as an admin
2. Go to Settings > Profit Margins
3. Set the percentage for each service type
4. Save the settings

The system will automatically apply these margins to calculate selling prices.

## License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).