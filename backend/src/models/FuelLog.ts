import mongoose, { Schema } from 'mongoose';
import { FuelLog } from '@shared/types';

const FuelLogSchema = new Schema({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', default: null },
  liters: { type: Number, required: true },
  cost: { type: Number, required: true },
  date: { type: Date, required: true },
}, { timestamps: true });

FuelLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const FuelLogModel = mongoose.model('FuelLog', FuelLogSchema);
