import mongoose from 'mongoose';
import { IContract } from './contract.model';

export interface IInvoice extends mongoose.Document {
  contract: mongoose.Types.ObjectId | IContract;
  tenantName: string;
  tenantPhone: string;
  apartmentId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  status: 'Paid' | 'Unpaid' | 'Partially Paid';
  maintenanceRelated: boolean;
  maintenanceId?: mongoose.Types.ObjectId;
  paidAmount: number;
  description: string;
  createdAt: Date;
}

const InvoiceSchema = new mongoose.Schema({
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  tenantName: {
    type: String,
    required: [true, 'Tenant name is required']
  },
  tenantPhone: {
    type: String,
    required: [true, 'Tenant phone is required']
  },
  apartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add invoice amount']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add due date']
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partially Paid'],
    default: 'Unpaid'
  },
  maintenanceRelated: {
    type: Boolean,
    default: false
  },
  maintenanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Maintenance'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Please add invoice description']
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
InvoiceSchema.virtual('payments', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'invoice',
  justOne: false
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema); 