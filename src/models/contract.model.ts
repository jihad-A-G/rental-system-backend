import mongoose from 'mongoose';
import { IApartment } from './apartment.model';

export interface ITenant {
  name: string;
  phone: string;
  idImagePath: string;
}

export interface IContract extends mongoose.Document {
  apartment: mongoose.Types.ObjectId | IApartment;
  tenant: ITenant;
  contractFile: string;
  duration: number; // in years
  paymentFrequency: 'yearly' | 'bi-annually' | 'quarterly' | 'monthly';
  startDate: Date;
  endDate: Date;
  amount: number;
  isActive: boolean;
  createdAt: Date;
}

const TenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add tenant name']
  },
  phone: {
    type: String,
    required: [true, 'Please add tenant phone number']
  },
  idImagePath: {
    type: String,
    required: [true, 'Please upload tenant ID']
  }
});

const ContractSchema = new mongoose.Schema({
  apartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  tenant: TenantSchema,
  contractFile: {
    type: String,
    required: [true, 'Please upload contract file']
  },
  duration: {
    type: Number,
    required: [true, 'Please specify contract duration in years']
  },
  paymentFrequency: {
    type: String,
    enum: ['yearly', 'bi-annually', 'quarterly', 'monthly'],
    required: [true, 'Please specify payment frequency']
  },
  startDate: {
    type: Date,
    required: [true, 'Please specify contract start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please specify contract end date']
  },
  amount: {
    type: Number,
    required: [true, 'Please specify contract amount']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Reverse populate with virtuals
ContractSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'contract',
  justOne: false
});

export default mongoose.model<IContract>('Contract', ContractSchema); 