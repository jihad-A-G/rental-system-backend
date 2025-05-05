import mongoose from 'mongoose';
import { IApartment } from './apartment.model';

export interface IExpense extends mongoose.Document {
  category: 'Utilities' | 'Internet' | 'Marketing' | 'Taxes' | 'Maintenance' | 'Other';
  amount: number;
  description: string;
  apartment?: mongoose.Types.ObjectId | IApartment;
  date: Date;
  invoiceFile?: string;
  recurring: boolean;
  frequencyMonths?: number;
  createdAt: Date;
}

const ExpenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Utilities', 'Internet', 'Marketing', 'Taxes', 'Maintenance', 'Other'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add expense amount']
  },
  description: {
    type: String,
    required: [true, 'Please add expense description']
  },
  apartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apartment'
  },
  date: {
    type: Date,
    required: [true, 'Please add expense date'],
    default: Date.now
  },
  invoiceFile: {
    type: String
  },
  recurring: {
    type: Boolean,
    default: false
  },
  frequencyMonths: {
    type: Number,
    validate: {
      validator: function(v: number) {
        return v > 0;
      },
      message: 'Frequency must be greater than 0'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IExpense>('Expense', ExpenseSchema); 