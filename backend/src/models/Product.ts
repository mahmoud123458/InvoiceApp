import mongoose, { Document, Schema } from 'mongoose';
import { localStore } from '../storage/localStore';

export interface IProduct extends Document {
  name: string;
  sku: string;
  description?: string;
  quantity: number;
  price: number;
  lowStockAlert: number;
  category?: string;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    lowStockAlert: { type: Number, default: 10 },
    category: { type: String, trim: true },
  },
  { timestamps: true }
);

const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

const ProductProxy = new Proxy(ProductModel, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    const local = (localStore.products as any)[prop as string];
    if (local !== undefined) {
      return typeof local === 'function' ? local.bind(localStore.products) : local;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default ProductProxy as unknown as typeof ProductModel;
