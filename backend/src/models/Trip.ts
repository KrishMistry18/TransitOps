import mongoose, { Schema } from 'mongoose';
import { Trip } from '@shared/types';

const TripSchema = new Schema({
  source: { type: String, required: true },
  destination: { type: String, required: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  cargoWeight: { type: Number, required: true },
  plannedDistance: { type: Number, required: true },
  actualDistance: { type: Number },
  fuelConsumed: { type: Number },
  revenue: { type: Number },
  status: { type: String, enum: ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"], required: true },
  dispatchedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

TripSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const TripModel = mongoose.model('Trip', TripSchema);
