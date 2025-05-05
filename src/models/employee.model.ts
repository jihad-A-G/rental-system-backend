import mongoose from 'mongoose';

export interface IEmployee extends mongoose.Document {
  name: string;
  role: 'Security' | 'Gate Keeper' | 'Cleaner' | 'Manager' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  salary: number;
  joiningDate: Date;
  isActive: boolean;
  emergencyContact?: string;
  createdAt: Date;
}

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add employee name']
  },
  role: {
    type: String,
    enum: ['Security', 'Gate Keeper', 'Cleaner', 'Manager', 'Other'],
    required: [true, 'Please specify employee role']
  },
  phone: {
    type: String,
    required: [true, 'Please add employee phone number']
  },
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  address: {
    type: String
  },
  salary: {
    type: Number,
    required: [true, 'Please add employee salary']
  },
  joiningDate: {
    type: Date,
    required: [true, 'Please add joining date'],
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emergencyContact: {
    type: String
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
EmployeeSchema.virtual('salaries', {
  ref: 'Salary',
  localField: '_id',
  foreignField: 'employee',
  justOne: false
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema); 