import mongoose, { Schema, Document } from 'mongoose';

export interface IDepotSettings extends Document {
  depotName: string;
  currency: string;
  distanceUnit: string;
}

const DepotSettingsSchema = new Schema({
  depotName: { type: String },
  currency: { type: String, default: "INR" },
  distanceUnit: { type: String, default: "km" },
}, { timestamps: true });

DepotSettingsSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export const DepotSettingsModel = mongoose.model<IDepotSettings>('DepotSettings', DepotSettingsSchema);
