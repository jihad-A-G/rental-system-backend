import mongoose from 'mongoose';
import { IApartment } from './apartment.model';

export interface IServiceProvider {
  name: string;
  contact: string;
  company?: string;
}

export interface IMaintenance extends mongoose.Document {
  apartment: mongoose.Types.ObjectId | IApartment;
  serviceProvider: IServiceProvider;
  description: string;
  cost: number;
  invoiceFile?: string;
  status: 'Pending' | 'Paid by Owner';
  billToTenant: boolean;
  tenantInvoiceId?: mongoose.Types.ObjectId;
  maintenanceDate: Date;
  completionDate?: Date;
  createdAt: Date;
}

const ServiceProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add service provider name']
  },
  contact: {
    type: String,
    required: [true, 'Please add service provider contact']
  },
  company: {
    type: String
  }
});

const MaintenanceSchema = new mongoose.Schema({
  apartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  serviceProvider: ServiceProviderSchema,
  description: {
    type: String,
    required: [true, 'Please add maintenance description']
  },
  cost: {
    type: Number,
    required: [true, 'Please add maintenance cost']
  },
  invoiceFile: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid by Owner'],
    default: 'Pending'
  },
  billToTenant: {
    type: Boolean,
    default: false
  },
  tenantInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  maintenanceDate: {
    type: Date,
    required: [true, 'Please add maintenance date']
  },
  completionDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema); 