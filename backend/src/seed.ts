import dotenv from 'dotenv';
import connectDB from './config/db';
import User from './models/User';
import Client from './models/Client';
import Product from './models/Product';
import ShippingCompany from './models/ShippingCompany';
import Invoice from './models/Invoice';
import PurchaseOrder from './models/PurchaseOrder';

dotenv.config();

export async function seedData(clean = false) {
  try {
    if (clean) {
      console.log('🔄 Cleaning existing collections...');
      await User.deleteMany({});
      await Client.deleteMany({});
      await Product.deleteMany({});
      await ShippingCompany.deleteMany({});
      await Invoice.deleteMany({});
      await PurchaseOrder.deleteMany({});
    }

    const userCount = await User.countDocuments();
    if (userCount > 0 && !clean) {
      console.log('ℹ️ Database already has data. Skipping automatic seed.');
      return;
    }

    console.log('🌱 Seeding default demo data...');

    // 1. Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@invoices.com',
      password: 'admin123',
      role: 'admin',
    });

    const staffUser = await User.create({
      name: 'Sales Staff',
      email: 'user@invoices.com',
      password: 'user123',
      role: 'user',
    });

    console.log('✅ Default users created: admin@invoices.com (password: admin123)');

    // 2. Shipping Companies
    const aramex = await ShippingCompany.create({
      name: 'Aramex Express',
      phone: '+20 2 3338 9700',
      email: 'support@aramex.com',
      address: 'Cairo Logistics Hub, Egypt',
      avgDeliveryDays: 2,
      pricePerKg: 3.5,
      notes: 'Next-day delivery inside major metropolitan zones.',
      isActive: true,
    });

    const dhl = await ShippingCompany.create({
      name: 'DHL Global Express',
      phone: '+20 2 16345',
      email: 'express@dhl.com',
      address: 'Cairo Airport Cargo Village',
      avgDeliveryDays: 1,
      pricePerKg: 6.0,
      notes: 'Priority express international & domestic shipping.',
      isActive: true,
    });

    await ShippingCompany.create({
      name: 'Bosta Delivery',
      phone: '+20 109 999 8888',
      email: 'hello@bosta.co',
      address: 'Smart Village, Giza',
      avgDeliveryDays: 3,
      pricePerKg: 2.5,
      notes: 'E-commerce and cash-on-delivery specialist.',
      isActive: true,
    });

    // 3. Products
    const laptop = await Product.create({
      name: 'Dell XPS 15 Laptop',
      sku: 'DELL-XPS-15',
      description: '15.6 inch 4K OLED, 32GB RAM, 1TB SSD',
      quantity: 15,
      price: 1850.0,
      lowStockAlert: 5,
      category: 'Electronics',
    });

    const mouse = await Product.create({
      name: 'Logitech MX Master 3S',
      sku: 'LOGI-MX3S',
      description: 'Ergonomic wireless productivity mouse',
      quantity: 45,
      price: 99.0,
      lowStockAlert: 10,
      category: 'Accessories',
    });

    const keyboard = await Product.create({
      name: 'Keychron Q1 Pro Mechanical Keyboard',
      sku: 'KEY-Q1-PRO',
      description: 'Custom wireless mechanical keyboard',
      quantity: 4, // low stock alert!
      price: 199.0,
      lowStockAlert: 8,
      category: 'Accessories',
    });

    const monitor = await Product.create({
      name: 'LG UltraFine 27" 4K Monitor',
      sku: 'LG-27-4K',
      description: 'IPS display with USB-C 90W PD',
      quantity: 12,
      price: 499.0,
      lowStockAlert: 5,
      category: 'Monitors',
    });

    // 4. Clients
    const client1 = await Client.create({
      name: 'Ahmed Mansour',
      company: 'Mansour Trading Co.',
      email: 'ahmed@mansour.com',
      phone: '+20 100 555 1234',
      address: '45 Nasr City, Cairo, Egypt',
      notes: 'VIP customer, preferred payment net-30.',
    });

    const client2 = await Client.create({
      name: 'Sarah Khaled',
      company: 'Nile Creative Agency',
      email: 'sarah@nilecreative.com',
      phone: '+20 111 888 7766',
      address: '12 Zamalek, Cairo, Egypt',
    });

    await Client.create({
      name: 'Modern Tech Solutions',
      company: 'MTS Enterprise',
      email: 'procurement@mts.org',
      phone: '+20 122 333 4455',
      address: 'New Cairo Technology Park',
    });

    // 5. Sample Invoices
    await Invoice.create({
      invoiceNumber: 'INV-00001',
      client: client1._id,
      items: [
        {
          product: laptop._id,
          productName: laptop.name,
          quantity: 2,
          unitPrice: 1850,
          total: 3700,
        },
        {
          product: mouse._id,
          productName: mouse.name,
          quantity: 2,
          unitPrice: 99,
          total: 198,
        },
      ],
      subtotal: 3898,
      tax: 14,
      discount: 100,
      total: 3898 + (3898 * 14) / 100 - 100,
      status: 'paid',
      shippingCompany: aramex._id,
      shippingStatus: 'delivered',
      deliveredAt: new Date(),
      createdBy: admin._id,
    });

    await Invoice.create({
      invoiceNumber: 'INV-00002',
      client: client2._id,
      items: [
        {
          product: monitor._id,
          productName: monitor.name,
          quantity: 1,
          unitPrice: 499,
          total: 499,
        },
        {
          product: keyboard._id,
          productName: keyboard.name,
          quantity: 1,
          unitPrice: 199,
          total: 199,
        },
      ],
      subtotal: 698,
      tax: 14,
      discount: 0,
      total: 698 + (698 * 14) / 100,
      status: 'sent',
      shippingCompany: dhl._id,
      shippingStatus: 'shipped',
      createdBy: staffUser._id,
    });

    // 6. Sample Purchase Order
    await PurchaseOrder.create({
      orderNumber: 'PO-00001',
      supplier: 'TechSource Global Ltd.',
      supplierContact: 'sales@techsource.com / +1 800 555 0199',
      items: [
        {
          product: keyboard._id,
          productName: keyboard.name,
          quantity: 20,
          unitPrice: 130,
          total: 2600,
        },
        {
          product: mouse._id,
          productName: mouse.name,
          quantity: 30,
          unitPrice: 65,
          total: 1950,
        },
      ],
      subtotal: 4550,
      total: 4550,
      status: 'pending',
      notes: 'Urgent restocking order for upcoming month.',
      createdBy: staffUser._id,
    });

    console.log('🎉 Default data seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

// Standalone execution
if (require.main === module) {
  connectDB().then(() => {
    seedData(true).then(() => process.exit(0));
  });
}
