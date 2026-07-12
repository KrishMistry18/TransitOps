import mongoose, { Schema } from 'mongoose';
import { DepotSettings } from '@shared/types';

const DepotSettingsSchema = new Schema({
  depotName: { type: String, required: true },
  currency: { type: String, required: true, default: 'USD' },
  distanceUnit: { type: String, required: true, default: 'km' },
}, { timestamps: true });

DepotSettingsSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const DepotSettingsModel = mongoose.model('DepotSettings', DepotSettingsSchema);
