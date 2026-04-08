import app from "./app";
import { logger } from "./lib/logger";
import { db, pool } from "@workspace/db";
import { usersTable, storesTable, productsTable, salesTable, ratingsTable, settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sql as drizzleSql } from "drizzle-orm";
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
    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      status text NOT NULL DEFAULT 'completed',
      total numeric(12,2) NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id serial PRIMARY KEY,
      order_id integer NOT NULL,
      product_id integer NOT NULL,
      store_id integer NOT NULL,
      product_name text NOT NULL,
      store_name text NOT NULL,
      quantity integer NOT NULL,
      unit_price numeric(10,2) NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS branches (
      id serial PRIMARY KEY,
      store_id integer NOT NULL,
      name text NOT NULL,
      address text NOT NULL,
      phone text,
      lat real,
      lng real,
      active boolean NOT NULL DEFAULT true,
      manager_name text,
      open_hours text DEFAULT 'Lun-Vie 8:00-18:00',
      notes text,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS documents (
      id serial PRIMARY KEY,
      store_id integer,
      user_id integer,
      order_id integer,
      name text NOT NULL,
      type text NOT NULL DEFAULT 'other',
      content text,
      url text,
      mime_type text DEFAULT 'application/pdf',
      size integer,
      tags text,
      status text NOT NULL DEFAULT 'active',
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS settings (
      id serial PRIMARY KEY,
      key text NOT NULL UNIQUE,
      value text,
      label text NOT NULL DEFAULT '',
      category text NOT NULL DEFAULT 'general',
      description text,
      input_type text NOT NULL DEFAULT 'text',
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id serial PRIMARY KEY,
      user_id integer,
      store_id integer,
      title text NOT NULL,
      body text NOT NULL,
      type text NOT NULL DEFAULT 'info',
      channel text NOT NULL DEFAULT 'in_app',
      read boolean NOT NULL DEFAULT false,
      data text,
      sent_at timestamp NOT NULL DEFAULT now()
    );
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_phone text;
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url text;
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS website text;
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS open_hours text;
  `);
  logger.info("Schema ensured (tables created if missing)");
}

async function ensureSettings() {
  const defaults = [
    { key: "app_name", value: "DISTRIMED", label: "Nombre de la aplicación", category: "general", description: "Nombre que aparece en la app y notificaciones", inputType: "text" },
    { key: "app_tagline", value: "Sistema de Distribución Médica – Medellín", label: "Slogan", category: "general", description: "Subtítulo mostrado en la pantalla de inicio", inputType: "text" },
    { key: "contact_email", value: "admin@distri.co", label: "Email de contacto", category: "general", description: "Email principal de soporte", inputType: "email" },
    { key: "contact_phone", value: "+57 300 123 4567", label: "Teléfono de contacto", category: "general", description: "Teléfono de atención al cliente", inputType: "tel" },
    { key: "primary_color", value: "#00FFCC", label: "Color primario", category: "appearance", description: "Color de acento principal de la interfaz", inputType: "color" },
    { key: "secondary_color", value: "#7C3AED", label: "Color secundario", category: "appearance", description: "Color secundario para botones y badges", inputType: "color" },
    { key: "low_stock_threshold", value: "10", label: "Umbral de bajo stock", category: "inventory", description: "Cantidad mínima para alertas de stock bajo", inputType: "number" },
    { key: "max_order_items", value: "50", label: "Máx. items por pedido", category: "inventory", description: "Número máximo de productos distintos por pedido", inputType: "number" },
    { key: "whatsapp_enabled", value: "false", label: "WhatsApp activado", category: "whatsapp", description: "Activar notificaciones vía WhatsApp", inputType: "boolean" },
    { key: "whatsapp_account_sid", value: "", label: "Twilio Account SID", category: "whatsapp", description: "Account SID de Twilio para WhatsApp", inputType: "password" },
    { key: "whatsapp_auth_token", value: "", label: "Twilio Auth Token", category: "whatsapp", description: "Auth Token de Twilio para WhatsApp", inputType: "password" },
    { key: "whatsapp_from", value: "whatsapp:+14155238886", label: "Número WhatsApp origen", category: "whatsapp", description: "Número de WhatsApp Business (sandbox o propio)", inputType: "text" },
    { key: "whatsapp_webhook_url", value: "", label: "URL Webhook", category: "whatsapp", description: "URL pública para recibir mensajes entrantes de WhatsApp", inputType: "url" },
    { key: "notifications_enabled", value: "true", label: "Notificaciones activadas", category: "notifications", description: "Activar sistema de notificaciones en la app", inputType: "boolean" },
    { key: "order_notification_admin", value: "true", label: "Notificar admin en pedidos", category: "notifications", description: "Enviar notificación al admin cuando hay un nuevo pedido", inputType: "boolean" },
    { key: "currency", value: "COP", label: "Moneda", category: "general", description: "Moneda del sistema (ISO 4217)", inputType: "text" },
    { key: "timezone", value: "America/Bogota", label: "Zona horaria", category: "general", description: "Zona horaria del servidor", inputType: "text" },
    { key: "maps_provider", value: "openstreetmap", label: "Proveedor de mapas", category: "general", description: "Proveedor de mapas para la app", inputType: "text" },
    { key: "google_maps_key", value: "", label: "Google Maps API Key", category: "general", description: "Clave de API de Google Maps (opcional)", inputType: "password" },
    { key: "deploy_url", value: "", label: "URL de producción", category: "deployment", description: "URL pública del despliegue en producción", inputType: "url" },
    { key: "maintenance_mode", value: "false", label: "Modo mantenimiento", category: "deployment", description: "Mostrar mensaje de mantenimiento a usuarios", inputType: "boolean" },
    { key: "max_stores", value: "50", label: "Máx. tiendas activas", category: "deployment", description: "Límite de tiendas activas en el sistema", inputType: "number" },
  ];

  for (const s of defaults) {
    await pool.query(
      `INSERT INTO settings (key, value, label, category, description, input_type, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,now())
       ON CONFLICT (key) DO NOTHING`,
      [s.key, s.value, s.label, s.category, s.description, s.inputType]
    );
  }
  logger.info("Settings ensured (defaults inserted if missing)");
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
  .then(() => ensureSettings())
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
