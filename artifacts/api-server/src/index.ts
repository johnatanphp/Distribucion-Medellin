import app from "./app";
import { logger } from "./lib/logger";
import { db, pool } from "@workspace/db";
import { usersTable, storesTable, productsTable, salesTable, ratingsTable } from "@workspace/db/schema";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id serial PRIMARY KEY,
      name text NOT NULL,
      address text NOT NULL,
      phone text NOT NULL,
      email text NOT NULL,
      lat real NOT NULL,
      lng real NOT NULL,
      active boolean NOT NULL DEFAULT true,
      description text NOT NULL DEFAULT '',
      image_url text,
      total_sales numeric(12,2) NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      name text NOT NULL,
      role text NOT NULL DEFAULT 'customer',
      store_id integer,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS products (
      id serial PRIMARY KEY,
      name text NOT NULL,
      description text NOT NULL,
      price numeric(10,2) NOT NULL,
      category text NOT NULL,
      image_url text,
      stock integer NOT NULL DEFAULT 0,
      store_id integer NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sales (
      id serial PRIMARY KEY,
      product_id integer NOT NULL,
      store_id integer NOT NULL,
      user_id integer,
      quantity integer NOT NULL DEFAULT 1,
      amount numeric(10,2) NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS ratings (
      id serial PRIMARY KEY,
      product_id integer NOT NULL,
      user_id integer NOT NULL,
      stars integer NOT NULL,
      comment text,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `);
  logger.info("Schema ensured (tables created if missing)");
}

async function autoSeedIfEmpty() {
  try {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
    if (existing.length > 0) return;

    logger.info("Database is empty — running initial seed...");

    const [store1, store2] = await db.insert(storesTable).values([
      { name: "Distribuidora Norte", address: "Calle 80 #45-10, Medellín", phone: "3001234567", email: "norte@distri.co", lat: 6.2907, lng: -75.5748, active: true, description: "Sucursal norte de la ciudad, especializada en productos farmacéuticos y de consumo masivo." },
      { name: "Distribuidora Poblado", address: "El Poblado #10-30, Medellín", phone: "3007654321", email: "poblado@distri.co", lat: 6.2099, lng: -75.5680, active: true, description: "Sucursal premium en El Poblado con los mejores productos importados." },
      { name: "Distribuidora Centro", address: "Carrera 52 #48-31, Medellín", phone: "3009876543", email: "centro@distri.co", lat: 6.2518, lng: -75.5636, active: false, description: "Sucursal céntrica. Temporalmente suspendida por renovación." },
    ]).returning();

    const [adminHash, tiendaHash, passHash] = await Promise.all([
      bcrypt.hash("admin123", 10),
      bcrypt.hash("tienda123", 10),
      bcrypt.hash("pass123", 10),
    ]);

    const [, , , pedro, maria] = await db.insert(usersTable).values([
      { email: "admin@distri.co", password: adminHash, name: "Admin DISTRIMED", role: "superadmin", active: true },
      { email: "norte@distri.co", password: tiendaHash, name: "Carlos Norte", role: "store", storeId: store1.id, active: true },
      { email: "poblado@distri.co", password: tiendaHash, name: "Ana Poblado", role: "store", storeId: store2.id, active: true },
      { email: "pedro@gmail.com", password: passHash, name: "Pedro Ramírez", role: "customer", active: true },
      { email: "maria@gmail.com", password: passHash, name: "María García", role: "customer", active: true },
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
        salesData.push({ productId: prod.id, storeId, userId: i % 3 === 0 ? pedro.id : maria.id, quantity: qty, amount: String(Number(prod.price) * qty), createdAt: date });
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

    logger.info("Initial seed complete — demo accounts ready");
  } catch (err) {
    logger.warn({ err }, "Auto-seed skipped or failed (tables may not exist yet)");
  }
}

ensureSchema()
  .then(() => autoSeedIfEmpty())
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Fatal error during startup");
    process.exit(1);
  });
