import { db } from "@workspace/db";
import { usersTable, storesTable, productsTable, salesTable, ratingsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.execute(sql`TRUNCATE ratings, sales, products, users, stores RESTART IDENTITY CASCADE`);

  const [store1, store2, store3] = await db.insert(storesTable).values([
    {
      name: "Distribuidora Norte",
      address: "Calle 80 #45-10, Medellín",
      phone: "3001234567",
      email: "norte@distri.co",
      lat: 6.2907,
      lng: -75.5748,
      active: true,
      description: "Sucursal norte de la ciudad, especializada en productos farmacéuticos y de consumo masivo.",
    },
    {
      name: "Distribuidora Poblado",
      address: "El Poblado #10-30, Medellín",
      phone: "3007654321",
      email: "poblado@distri.co",
      lat: 6.2099,
      lng: -75.5680,
      active: true,
      description: "Sucursal premium en El Poblado con los mejores productos importados.",
    },
    {
      name: "Distribuidora Centro",
      address: "Carrera 52 #48-31, Medellín",
      phone: "3009876543",
      email: "centro@distri.co",
      lat: 6.2518,
      lng: -75.5636,
      active: false,
      description: "Sucursal céntrica. Temporalmente suspendida por renovación.",
    },
  ]).returning();

  const [admin, carlosNorte, anaPoblado, pedro, maria] = await db.insert(usersTable).values([
    {
      email: "admin@distri.co",
      password: "admin123",
      name: "Admin DISTRIMED",
      role: "superadmin",
      active: true,
    },
    {
      email: "norte@distri.co",
      password: "tienda123",
      name: "Carlos Norte",
      role: "store",
      storeId: store1.id,
      active: true,
    },
    {
      email: "poblado@distri.co",
      password: "tienda123",
      name: "Ana Poblado",
      role: "store",
      storeId: store2.id,
      active: true,
    },
    {
      email: "pedro@gmail.com",
      password: "pass123",
      name: "Pedro Ramírez",
      role: "customer",
      active: true,
    },
    {
      email: "maria@gmail.com",
      password: "pass123",
      name: "María García",
      role: "customer",
      active: true,
    },
  ]).returning();

  const products1 = await db.insert(productsTable).values([
    { name: "Acetaminofén 500mg", description: "Analgésico y antipirético, caja x 100 tabletas", price: "18500", category: "Medicamentos", stock: 150, storeId: store1.id, active: true },
    { name: "Ibuprofeno 400mg", description: "Antiinflamatorio no esteroideo, caja x 50 tabletas", price: "22000", category: "Medicamentos", stock: 80, storeId: store1.id, active: true },
    { name: "Vitamina C 1000mg", description: "Suplemento vitamínico, frasco x 60 cápsulas", price: "35000", category: "Suplementos", stock: 60, storeId: store1.id, active: true },
    { name: "Alcohol Antiséptico 500ml", description: "Alcohol al 70% para uso externo", price: "12000", category: "Asepsia", stock: 3, storeId: store1.id, active: true },
    { name: "Termómetro Digital", description: "Termómetro infrarrojo de alta precisión", price: "45000", category: "Dispositivos", stock: 25, storeId: store1.id, active: true },
  ]).returning();

  const products2 = await db.insert(productsTable).values([
    { name: "Omeprazol 20mg", description: "Inhibidor de la bomba de protones, caja x 30 cápsulas", price: "28000", category: "Medicamentos", stock: 90, storeId: store2.id, active: true },
    { name: "Loratadina 10mg", description: "Antihistamínico, caja x 20 tabletas", price: "15000", category: "Medicamentos", stock: 120, storeId: store2.id, active: true },
    { name: "Proteína Whey 1kg", description: "Suplemento proteico sabor vainilla", price: "89000", category: "Suplementos", stock: 30, storeId: store2.id, active: true },
    { name: "Tensiómetro Digital", description: "Monitor de presión arterial automático de brazo", price: "120000", category: "Dispositivos", stock: 2, storeId: store2.id, active: true },
    { name: "Gel Antibacterial 500ml", description: "Gel desinfectante con aloe vera", price: "16000", category: "Asepsia", stock: 200, storeId: store2.id, active: true },
  ]).returning();

  const now = new Date();
  const salesData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const storeProds = i % 2 === 0 ? products1 : products2;
    const storeId = i % 2 === 0 ? store1.id : store2.id;
    const numSales = Math.floor(Math.random() * 4) + 1;
    for (let s = 0; s < numSales; s++) {
      const prod = storeProds[Math.floor(Math.random() * storeProds.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      salesData.push({
        productId: prod.id,
        storeId,
        userId: i % 3 === 0 ? pedro.id : maria.id,
        quantity: qty,
        amount: String(Number(prod.price) * qty),
        createdAt: date,
      });
    }
  }
  await db.insert(salesTable).values(salesData);

  await db.insert(ratingsTable).values([
    { productId: products1[0].id, userId: pedro.id, stars: 5, comment: "Excelente producto, muy efectivo" },
    { productId: products1[0].id, userId: maria.id, stars: 4, comment: "Buen precio y calidad" },
    { productId: products1[1].id, userId: pedro.id, stars: 4, comment: "Funciona bien para el dolor" },
    { productId: products1[2].id, userId: maria.id, stars: 5, comment: "Me encanta, lo pido siempre" },
    { productId: products2[0].id, userId: pedro.id, stars: 5, comment: "Muy bueno para la gastritis" },
    { productId: products2[2].id, userId: maria.id, stars: 3, comment: "Regular, prefiero otra marca" },
    { productId: products2[3].id, userId: pedro.id, stars: 5, comment: "Muy preciso y fácil de usar" },
  ]);

  console.log(`✅ Seed complete:`);
  console.log(`   - 3 stores (2 active, 1 inactive)`);
  console.log(`   - 5 users (1 admin, 2 store, 2 customer)`);
  console.log(`   - 10 products (5 per store)`);
  console.log(`   - ${salesData.length} sales (30 days of history)`);
  console.log(`   - 7 ratings`);
  console.log(`\n🔑 Demo credentials:`);
  console.log(`   Admin:    admin@distri.co   / admin123`);
  console.log(`   Store 1:  norte@distri.co   / tienda123`);
  console.log(`   Store 2:  poblado@distri.co / tienda123`);
  console.log(`   Customer: pedro@gmail.com   / pass123`);
  console.log(`   Customer: maria@gmail.com   / pass123`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
