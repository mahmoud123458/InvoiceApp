import mongoose, { Document, Schema } from 'mongoose';
import { localStore } from '../storage/localStore';

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  notes?: string;
  createdAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    company: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const ClientModel = mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);

const ClientProxy = new Proxy(ClientModel, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    const local = (localStore.clients as any)[prop as string];
    if (local !== undefined) {
      return typeof local === 'function' ? local.bind(localStore.clients) : local;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default ClientProxy as unknown as typeof ClientModel;
