import mongoose from 'mongoose';
import { IEmployee } from './employee.model';

export interface ISalary extends mongoose.Document {
  employee: mongoose.Types.ObjectId | IEmployee;
  amount: number;
  month: number;
  year: number;
  isPaid: boolean;
  paymentDate?: Date;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Check' | 'Other';
  description?: string;
  createdAt: Date;
}

const SalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add salary amount']
  },
  month: {
    type: Number,
    required: [true, 'Please add salary month'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Please add salary year']
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Check', 'Other']
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ISalary>('Salary', SalarySchema); 