import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database';
import path from 'path';
import logger from './middleware/logger.middleware';
import { setupSwagger } from './docs/swagger-config';

// Import routes
import apartmentRoutes from './routes/apartment.routes';
import contractRoutes from './routes/contract.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import expenseRoutes from './routes/expense.routes';
import employeeRoutes from './routes/employee.routes';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

// Create Express application
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/employees', employeeRoutes);

// Default route
app.get('/', (req: Request, res: Response) => {
  res.send('Rental System API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 