import mongoose, { Schema } from 'mongoose';
import { MaintenanceLog } from '@shared/types';

const MaintenanceLogSchema = new Schema({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  description: { type: String, required: true },
  cost: { type: Number, required: true },
  status: { type: String, enum: ["ACTIVE", "CLOSED"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
}, { timestamps: true });

MaintenanceLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const MaintenanceLogModel = mongoose.model('MaintenanceLog', MaintenanceLogSchema);
