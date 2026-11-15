import mongoose, { Document, Schema } from 'mongoose';
import { localStore } from '../storage/localStore';

export interface IShippingCompany extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  avgDeliveryDays: number;
  pricePerKg?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

const shippingCompanySchema = new Schema<IShippingCompany>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String },
    avgDeliveryDays: { type: Number, required: true, default: 3 },
    pricePerKg: { type: Number },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ShippingCompanyModel =
  mongoose.models.ShippingCompany ||
  mongoose.model<IShippingCompany>('ShippingCompany', shippingCompanySchema);

const ShippingCompanyProxy = new Proxy(ShippingCompanyModel, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    const local = (localStore.shippingCompanies as any)[prop as string];
    if (local !== undefined) {
      return typeof local === 'function' ? local.bind(localStore.shippingCompanies) : local;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default ShippingCompanyProxy as unknown as typeof ShippingCompanyModel;
