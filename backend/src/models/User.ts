import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { localStore } from '../storage/localStore';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

const UserProxy = new Proxy(UserModel, {
  get(target: any, prop: string | symbol, receiver: any) {
    if (mongoose.connection.readyState === 1) {
      return Reflect.get(target, prop, receiver);
    }
    const local = (localStore.users as any)[prop as string];
    if (local !== undefined) {
      return typeof local === 'function' ? local.bind(localStore.users) : local;
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default UserProxy as unknown as typeof UserModel;
