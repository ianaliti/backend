import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';
import { hash } from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Admin
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@restodigital.com' },
    update: {},
    create: {
      email: 'admin@restodigital.com',
      name: 'Admin',
      password: adminPassword,
    },
  });
  console.log('✓ Admin:', admin.email);

  // 2. Restaurant account (restaurateur)
  const restoPassword = await hash('resto123', 10);
  const restaurant = await prisma.restaurant.upsert({
    where: { email: 'restaurateur@restodigital.com' },
    update: {},
    create: {
      email: 'restaurateur@restodigital.com',
      name: 'La Maison Italienne',
      password: restoPassword,
      address: '123 Pasta Avenue',
      city: 'Little Italy',
      codePostal: '10013',
      phone: '+1 212 555 0101',
      cuisine: 'Italian',
      description: 'Authentic Italian cuisine in the heart of New York.',
      image: 'https://plus.unsplash.com/premium_photo-1672242676660-923c3bd446d7',
    },
  });
  console.log('✓ Restaurant:', restaurant.name);

  // 3. Second restaurant
  const sushiPassword = await hash('sushi123', 10);
  const sushi = await prisma.restaurant.upsert({
    where: { email: 'sushi@restodigital.com' },
    update: {},
    create: {
      email: 'sushi@restodigital.com',
      name: 'Sushi Master',
      password: sushiPassword,
      address: '456 Ocean Drive',
      city: 'Miami Beach',
      codePostal: '33139',
      phone: '+1 305 555 0202',
      cuisine: 'Japanese',
      description: 'The freshest sushi in Miami.',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351',
    },
  });
  console.log('✓ Restaurant:', sushi.name);

  // 4. Dishes for La Maison Italienne
  const italianDishes = [
    { name: 'Margherita Pizza', price: 12.50, category: 'Pizza', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca' },
    { name: 'Spaghetti Carbonara', price: 14.00, category: 'Pasta', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3' },
    { name: 'Tiramisu', price: 7.50, category: 'Dessert', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9' },
  ];
  for (const d of italianDishes) {
    await prisma.plat.upsert({
      where: { id: `italian-${d.name.toLowerCase().replace(/ /g, '-')}` },
      update: {},
      create: { id: `italian-${d.name.toLowerCase().replace(/ /g, '-')}`, ...d, restaurantId: restaurant.id },
    });
    console.log('  + dish:', d.name);
  }

  // 5. Dishes for Sushi Master
  const sushiDishes = [
    { name: 'California Roll', price: 10.00, category: 'Roll', image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20' },
    { name: 'Salmon Nigiri', price: 8.50, category: 'Nigiri', image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252' },
    { name: 'Miso Soup', price: 4.00, category: 'Soup', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd' },
  ];
  for (const d of sushiDishes) {
    await prisma.plat.upsert({
      where: { id: `sushi-${d.name.toLowerCase().replace(/ /g, '-')}` },
      update: {},
      create: { id: `sushi-${d.name.toLowerCase().replace(/ /g, '-')}`, ...d, restaurantId: sushi.id },
    });
    console.log('  + dish:', d.name);
  }

  // 6. Regular customer
  const userPassword = await hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@restodigital.com' },
    update: {},
    create: {
      email: 'user@restodigital.com',
      name: 'John Customer',
      password: userPassword,
    },
  });
  console.log('✓ Customer:', user.email);

  console.log('\nSeed complete!');
  console.log('  Admin:        admin@restodigital.com / admin123');
  console.log('  Restaurateur: restaurateur@restodigital.com / resto123');
  console.log('  Sushi:        sushi@restodigital.com / sushi123');
  console.log('  Customer:     user@restodigital.com / user123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
