import mongoose, { Schema } from 'mongoose';
import { Vehicle } from '@shared/types';

const VehicleSchema = new Schema({
  registrationNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  maxLoadCapacity: { type: Number, required: true },
  odometer: { type: Number, required: true },
  acquisitionCost: { type: Number, required: true },
  status: { type: String, enum: ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"], required: true },
  region: { type: String, required: true },
}, { timestamps: true });

VehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const VehicleModel = mongoose.model('Vehicle', VehicleSchema);
