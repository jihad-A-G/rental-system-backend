import mongoose from 'mongoose';

export interface IApartment extends mongoose.Document {
  level: number;
  location: string;
  number: string;
  rooms: number;
  amenities: string[];
  status: 'Available' | 'Occupied' | 'Under Maintenance';
  createdAt: Date;
}

const ApartmentSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: [true, 'Please add a level/floor number']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  number: {
    type: String,
    required: [true, 'Please add an apartment number'],
    unique: true
  },
  rooms: {
    type: Number,
    required: [true, 'Please add number of rooms']
  },
  amenities: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Under Maintenance'],
    default: 'Available'
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
ApartmentSchema.virtual('contracts', {
  ref: 'Contract',
  localField: '_id',
  foreignField: 'apartment',
  justOne: false
});

export default mongoose.model<IApartment>('Apartment', ApartmentSchema); 