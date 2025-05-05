import mongoose from 'mongoose';
import { IInvoice } from './invoice.model';

export interface IPayment extends mongoose.Document {
  invoice: mongoose.Types.ObjectId | IInvoice;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Check' | 'Other';
  receiptNumber: string;
  description: string;
  createdAt: Date;
}

const PaymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add payment amount']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Check', 'Other'],
    default: 'Cash'
  },
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: 'Rent Payment'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema); 