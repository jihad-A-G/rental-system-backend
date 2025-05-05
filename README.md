# Rental System API

A comprehensive backend system for managing apartment rentals, contracts, invoices, payments, maintenance requests, expenses, and employee salaries.

## Features

- Apartment management
- Contract creation with automatic invoice generation
- Invoice tracking
- Payment processing
- Maintenance request management
- Expense tracking
- Employee and salary management
- JWT-based authentication
- Role-based authorization

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd rental-system
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rental-system
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=30d
```

4. Create upload directories
```bash
mkdir -p uploads/contracts uploads/ids uploads/invoices
```

## Usage

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Apartments
- `GET /api/apartments` - Get all apartments
- `GET /api/apartments/:id` - Get single apartment
- `POST /api/apartments` - Create new apartment
- `PUT /api/apartments/:id` - Update apartment
- `DELETE /api/apartments/:id` - Delete apartment

### Contracts
- `GET /api/contracts` - Get all contracts
- `GET /api/contracts/:id` - Get single contract
- `POST /api/contracts` - Create new contract
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract
- `PUT /api/contracts/:id/upload` - Upload contract file

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/apartment/:apartmentId` - Get invoices by apartment

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get single payment
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/invoice/:invoiceId` - Get payments by invoice

### Maintenance
- `GET /api/maintenance` - Get all maintenance requests
- `GET /api/maintenance/:id` - Get single maintenance request
- `POST /api/maintenance` - Create new maintenance request
- `PUT /api/maintenance/:id` - Update maintenance request
- `DELETE /api/maintenance/:id` - Delete maintenance request
- `PUT /api/maintenance/:id/upload` - Upload maintenance invoice
- `GET /api/maintenance/apartment/:apartmentId` - Get maintenance by apartment

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `PUT /api/expenses/:id/upload` - Upload expense invoice
- `GET /api/expenses/category/:category` - Get expenses by category
- `GET /api/expenses/apartment/:apartmentId` - Get expenses by apartment

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/salaries` - Get employee salaries
- `POST /api/employees/:id/salaries` - Create salary for employee
- `GET /api/employees/salaries` - Get all salaries
- `PUT /api/employees/salaries/:id` - Update salary

## License

MIT 