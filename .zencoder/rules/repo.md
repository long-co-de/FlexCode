---
description: Repository Information Overview
alwaysApply: true
---

# VTU Application Information

## Summary

A comprehensive Virtual Top-Up (VTU) application built with **Laravel 12 and React via Inertia.js server-side rendering**. This is a full-stack web application (not REST API-based) that enables users to purchase airtime, data bundles, cable TV subscriptions, and pay electricity bills with integrated payment systems and admin management capabilities. Laravel handles server-side logic and renders React components via Inertia.

## Architecture

**Inertia.js SSR Application** — Laravel renders React components server-side, eliminating the need for a separate SPA API. Client requests return Inertia responses with pre-rendered React components and props.

The project follows a Laravel monolithic architecture:
- **Backend**: `/app` (Models, Controllers, Services), `/routes/web.php` (web routes using Inertia), `/config` (configuration)
- **Frontend**: `/resources/js` (React pages and components), `/resources/css` (stylesheets), `/resources/views/app.blade.php` (Inertia entry point)
- **Database**: `/database` (migrations, seeders, factories)
- **Testing**: `/tests` (Feature and Unit tests)
- **Configuration**: `/bootstrap`, `/config` directories

## Language & Runtime

**Backend Language**: PHP  
**Backend Version**: ^8.2  
**Frontend Language**: JavaScript (React)  
**Framework**: Laravel ^12.0  
**Frontend Framework**: React ^18.2.0 with Inertia.js ^2.0  
**Build System**: Vite ^4.0.0  
**Package Managers**: Composer (PHP), npm (JavaScript)

## Dependencies

**Main Backend Dependencies**:
- `laravel/framework`: ^12.0 — Core framework
- `inertiajs/inertia-laravel`: ^2.0 — Inertia.js integration
- `laravel/sanctum`: ^4.0 — API authentication
- `barryvdh/laravel-dompdf`: ^3.1 — PDF generation
- `simplesoftwareio/simple-qrcode`: * — QR code generation
- `tightenco/ziggy`: ^2.5 — JavaScript route generation

**Main Frontend Dependencies**:
- `react`: ^18.2.0
- `@inertiajs/react`: ^1.0.0
- `react-dom`: ^18.2.0
- `chart.js`: ^4.4.0 — Charting library
- `react-chartjs-2`: ^5.2.0 — Chart.js React wrapper
- `react-paystack`: ^6.0.0 — Payment integration
- `laravel-echo`: ^1.15.3 — Broadcasting
- `pusher-js`: ^8.3.0 — Real-time notifications

**Development Dependencies**:
- `pestphp/pest`: ^3.7 — Testing framework
- `pestphp/pest-plugin-laravel`: ^3.1 — Pest Laravel plugin
- `laravel/pint`: ^1.13 — Code formatter
- `laravel/sail`: ^1.41 — Docker environment
- `mockery/mockery`: ^1.6 — Mocking library
- `fakerphp/faker`: ^1.23 — Fake data generation

**Frontend Dev Dependencies**:
- `vite`: ^4.0.0 — Build tool
- `@vitejs/plugin-react`: ^4.0.3
- `tailwindcss`: ^3.2.1 — CSS framework
- `daisyui`: ^4.4.19 — UI component library
- `laravel-vite-plugin`: ^0.8.0

## Build & Installation

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Create .env file (from .env.example)
cp .env.example .env

# Generate application key
php artisan key:generate

# Run database migrations and seeders
php artisan migrate --seed

# Build frontend assets
npm run build

# (Development only) Start development servers
npm run dev
php artisan serve
```

**Development Script** (Composer):
```bash
composer run dev
# Runs: Laravel server, queue listener, and Vite dev server concurrently
```

## Main Files & Resources

**Application Entry Points**:
- `/public/index.php` — HTTP entry point
- `/resources/views/app.blade.php` — Inertia template (renders React with Vite bundling)
- `/resources/js/app.jsx` — React app initialization with Inertia setup
- `/routes/web.php` — Web routes (returns Inertia responses with React components)
- `/artisan` — Laravel CLI tool

**Route Organization** (web-based, not REST API):
- Dashboard and user services (airtime, data, cable, electricity, wallet)
- PIN management and authentication middleware
- Admin panel (users, transactions, coupons, networks, data plans, cable providers, electricity providers, payment methods, settings)
- Agent panel (transactions, messages)
- Borrowing system (airtime, data, electricity)
- Card management and payment processing
- Limited API routes at `/api` for Sanctum auth (mostly for mobile/external clients)

**React Components**:
- `/resources/js/Pages/` — Full-page Inertia components
- `/resources/js/Components/` — Reusable React components

**Configuration Files**:
- `/config/app.php` — Application configuration
- `/config/database.php` — Database configuration
- `/config/mail.php` — Email configuration
- `/config/queue.php` — Queue configuration
- `.env.example` — Environment variables template

**Database Setup**:
- `/database/migrations/` — Database schema
- `/database/seeders/` — Database seeders
- `/database/factories/` — Model factories for testing

## Testing

**Framework**: Pest with PHPUnit backend  
**Configuration Files**: `phpunit.xml`, `tests/Pest.php`  
**Test Locations**: 
- Feature tests: `/tests/Feature/`
- Unit tests: `/tests/Unit/`

**Test Execution**:
```bash
# Run all tests
./vendor/bin/pest

# Run Feature tests
./vendor/bin/pest tests/Feature

# Run Unit tests
./vendor/bin/pest tests/Unit

# Run with coverage
./vendor/bin/pest --coverage
```

## Key Services

**Backend Services** (`/app/Services/`):
- `HusmodataService` — Airtime/data API integration
- `PaystackService` — Payment processing
- `MonnifyService` — Payment gateway integration
- `XixatPayService` — Alternative payment service
- `VtpassService` — Utility bill payments
- `PaymentService` — Core payment logic
- `BorrowingService` — Loan/borrowing functionality
- `NotificationService` — User notifications

## Database

**Default**: SQLite (can be configured to MySQL/PostgreSQL)  
**Migrations**: Located in `/database/migrations/`  
**Setup**: Run `php artisan migrate --seed` to initialize and populate database with seed data

**Default Users** (after seeding):
- Admin: `admin@example.com` / `password`
- Test User: `user@example.com` / `password`

## Frontend Styling

**CSS Framework**: Tailwind CSS ^3.2.1  
**UI Components**: DaisyUI ^4.4.19  
**Configuration**: `/tailwind.config.js` — Custom theme with light/dark modes  
**Styles**: `/resources/css/app.css`

## Asset Compilation & Rendering

**Vite**: Build tool for frontend assets, configured with React plugin  
**Inertia.js**: Server-side rendering of React components via Laravel  
**Entry Template**: `/resources/views/app.blade.php` uses `@vite` and `@inertia` directives  
**Route Generation**: Ziggy package generates JavaScript route helpers from Laravel routes  
**Asset Pipeline**: CSS (Tailwind, DaisyUI), JavaScript (React, Inertia), compiled via Vite

## Validation & Code Quality

**Code Formatter**: Laravel Pint (PHP code style enforcement)  
**Testing**: Pest framework (PHPUnit backend) with feature and unit test suites  
**Database**: SQLite for development, MySQL/PostgreSQL for production  
**Request Validation**: Laravel Form Request classes in `/app/Http/Requests/`
