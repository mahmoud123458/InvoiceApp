import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoices_db';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to MongoDB successfully at:', mongoUri);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.log('ℹ️ MongoDB server not detected locally.');
    console.log('⚡ Active Data Layer: Local persistent database (backend/data/db.json).');
    console.log('🚀 Ready to serve all API requests instantly!');
  }
};

export default connectDB;
