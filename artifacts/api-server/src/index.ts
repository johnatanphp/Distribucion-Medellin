import app from "./app";
import { logger } from "./lib/logger";
import { db, pool } from "@workspace/db";
import { usersTable, storesTable, productsTable, salesTable, ratingsTable, settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sql as drizzleSql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

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
    { key: "app_tagline", value: "Red de Distribución Farmacéutica – Medellín", label: "Slogan", category: "general", description: "Subtítulo mostrado en la pantalla de inicio", inputType: "text" },
    { key: "contact_email", value: "admin@distri.co", label: "Email de contacto", category: "general", description: "Email principal de soporte", inputType: "email" },
    { key: "contact_phone", value: "+57 300 123 4567", label: "Teléfono de contacto", category: "general", description: "Teléfono de atención al cliente", inputType: "tel" },
    { key: "primary_color", value: "#0099B8", label: "Color primario", category: "appearance", description: "Color de acento principal de la interfaz", inputType: "color" },
    { key: "secondary_color", value: "#7C3AED", label: "Color secundario", category: "appearance", description: "Color secundario para botones y badges", inputType: "color" },
    { key: "low_stock_threshold", value: "10", label: "Umbral de bajo stock", category: "inventory", description: "Cantidad mínima para alertas de stock bajo", inputType: "number" },
    { key: "max_order_items", value: "50", label: "Máx. items por pedido", category: "inventory", description: "Número máximo de productos distintos por pedido", inputType: "number" },
    { key: "currency", value: "COP", label: "Moneda", category: "general", description: "Moneda del sistema (ISO 4217)", inputType: "text" },
    { key: "timezone", value: "America/Bogota", label: "Zona horaria", category: "general", description: "Zona horaria del servidor", inputType: "text" },
    { key: "maps_provider", value: "openstreetmap", label: "Proveedor de mapas", category: "general", description: "Proveedor de mapas para la app", inputType: "text" },
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

// Real Medellín pharmacies & distributors with accurate GPS coordinates
const ALL_STORES = [
  { name: "Distribuidora Norte", address: "Calle 80 #45-10, Aranjuez, Medellín", phone: "6042345678", email: "norte@distri.co", lat: 6.2907, lng: -75.5748, active: true, open_hours: "Lun-Sáb 7:00-20:00", description: "Sucursal norte de la ciudad, especializada en productos farmacéuticos y de consumo masivo. Amplia cobertura en barrios Aranjuez, Manrique y Villa del Socorro." },
  { name: "Distribuidora Poblado", address: "Av. El Poblado #16-30, Medellín", phone: "6042987654", email: "poblado@distri.co", lat: 6.2099, lng: -75.5680, active: true, open_hours: "Lun-Dom 8:00-22:00", description: "Sucursal premium en El Poblado con los mejores productos importados y servicio personalizado. Zona Rosa y CC El Tesoro." },
  { name: "Distribuidora Centro", address: "Cra. 52 #48-31, La Candelaria, Medellín", phone: "6043456789", email: "centro@distri.co", lat: 6.2518, lng: -75.5636, active: false, open_hours: "Lun-Vie 8:00-18:00", description: "Sucursal céntrica. Temporalmente suspendida por renovación de infraestructura. Reapertura próxima." },
  { name: "Distribuidora Laureles", address: "Cra. 76 #33-57, Laureles, Medellín", phone: "6044445566", email: "laureles@distri.co", lat: 6.2495, lng: -75.5952, active: true, open_hours: "Lun-Sáb 8:00-19:00", description: "Nodo de distribución en Laureles-Estadio, cobertura occidente. Cerca al Estadio Atanasio Girardot." },
  { name: "Distribuidora Belén", address: "Cra. 80 #30A-12, Belén, Medellín", phone: "6043337788", email: "belen@distri.co", lat: 6.2305, lng: -75.6070, active: true, open_hours: "Lun-Sáb 8:00-19:00", description: "Sucursal sur-occidente. Cubre Belén, La América y Calasanz con distribución rápida en moto." },
  { name: "Distribuidora Envigado", address: "Calle 40 Sur #45-20, Envigado", phone: "6042228899", email: "envigado@distri.co", lat: 6.1741, lng: -75.5908, active: true, open_hours: "Lun-Sáb 7:30-19:30", description: "Nodo Envigado — cobertura sur del área metropolitana. Distribuye a municipios del sur: Itagüí, La Estrella y Sabaneta." },
  { name: "Distribuidora Bello", address: "Clle. 49 #48-40, Centro, Bello", phone: "6043334455", email: "bello@distri.co", lat: 6.3354, lng: -75.5588, active: true, open_hours: "Lun-Sáb 7:00-19:00", description: "Sucursal norte del área metropolitana. Cubre Bello, Copacabana y zonas del norte del Valle de Aburrá." },
  { name: "Distribuidora Robledo", address: "Cra. 80 #65B-50, Robledo, Medellín", phone: "6044556677", email: "robledo@distri.co", lat: 6.2755, lng: -75.6012, active: true, open_hours: "Lun-Sáb 8:00-18:30", description: "Nodo noroccidente. Cobertura en comunas Robledo, Castilla y Doce de Octubre. Entrega a domicilio disponible." },
  { name: "Distribuidora Itagüí", address: "Cra. 51 #58 Sur-14, Centro, Itagüí", phone: "6042991122", email: "itagui@distri.co", lat: 6.1849, lng: -75.5996, active: true, open_hours: "Lun-Sáb 8:00-20:00", description: "Sucursal Itagüí — zona industrial sur. Distribuye a empresas y al público en Itagüí, La Estrella y Sabaneta." },
  { name: "Distribuidora Sabaneta", address: "Parque Principal #1-20, Sabaneta", phone: "6044112233", email: "sabaneta@distri.co", lat: 6.1498, lng: -75.6158, active: true, open_hours: "Lun-Sáb 8:00-18:00", description: "Sucursal Sabaneta — la ciudad más pequeña del mundo. Distribución express al sur del área metropolitana." },
  { name: "Distribuidora Calasanz", address: "Cra. 75 #44-60, Calasanz, Medellín", phone: "6043667788", email: "calasanz@distri.co", lat: 6.2368, lng: -75.5997, active: true, open_hours: "Lun-Sáb 8:00-19:00", description: "Sucursal Calasanz-Occidental. Cubre Santa Fe de Antioquia, Altavista y barrios de la vertiente occidental." },
  { name: "Distribuidora La Estrella", address: "Parque Principal La Estrella, Ant.", phone: "6043118899", email: "laestrella@distri.co", lat: 6.1574, lng: -75.6374, active: true, open_hours: "Lun-Sáb 8:00-17:30", description: "Sucursal La Estrella — municipio al sur-occidente. Farmacéuticos, nutricionales y dispositivos médicos." },
];

// Products catalog per store zone
const PRODUCTS_CATALOG: Record<string, Array<{ name: string; description: string; price: string; category: string; stock: number; imageUrl?: string }>> = {
  "norte": [
    { name: "Acetaminofén 500mg x100", description: "Analgésico y antipirético de alta pureza. Ideal para dolor de cabeza, fiebre y molestias musculares.", price: "18500", category: "Medicamentos", stock: 150 },
    { name: "Ibuprofeno 400mg x50", description: "Antiinflamatorio no esteroideo. Alivia dolor, inflamación y fiebre con acción prolongada.", price: "22000", category: "Medicamentos", stock: 80 },
    { name: "Amoxicilina 500mg x21", description: "Antibiótico de amplio espectro. Requiere fórmula médica.", price: "35000", category: "Medicamentos", stock: 40 },
    { name: "Diclofenaco Gel 50g", description: "Antiinflamatorio tópico para dolor muscular y articular. Absorción rápida.", price: "19500", category: "Medicamentos", stock: 90 },
    { name: "Vitamina C 1000mg x60", description: "Suplemento vitamínico de alta dosis. Refuerza el sistema inmune y antioxidante.", price: "35000", category: "Suplementos", stock: 60 },
    { name: "Complejo B x50", description: "Complejo vitamínico B1, B6, B12. Energía celular y función nerviosa.", price: "28000", category: "Suplementos", stock: 75 },
    { name: "Alcohol Antiséptico 500ml", description: "Alcohol isopropílico al 70% para desinfección de superficies y heridas.", price: "12000", category: "Asepsia", stock: 3 },
    { name: "Termómetro Infrarrojo", description: "Lectura frontal sin contacto en 1 segundo. Memoria de 20 lecturas. ±0.2°C precisión.", price: "75000", category: "Dispositivos", stock: 25 },
    { name: "Guantes Nitrilo x100", description: "Guantes desechables sin látex. Talla M. Aptos para manipulación de medicamentos.", price: "45000", category: "Asepsia", stock: 200 },
    { name: "Mascarilla KN95 x10", description: "Protección respiratoria 5 capas. Filtración ≥95% de partículas.", price: "32000", category: "Asepsia", stock: 120 },
  ],
  "poblado": [
    { name: "Omeprazol 20mg x30", description: "Inhibidor de la bomba de protones. Gastritis, úlceras y reflujo gastroesofágico.", price: "28000", category: "Medicamentos", stock: 90 },
    { name: "Loratadina 10mg x20", description: "Antihistamínico de segunda generación. No genera somnolencia. Alergia rhinitis.", price: "15000", category: "Medicamentos", stock: 120 },
    { name: "Metformina 850mg x30", description: "Antidiabético oral. Requiere fórmula médica. Control glucemia tipo 2.", price: "22000", category: "Medicamentos", stock: 55 },
    { name: "Proteína Whey Gold 1kg", description: "Proteína de suero de leche concentrada 80%. Sabor vainilla francesa. 25g proteína/porción.", price: "125000", category: "Suplementos", stock: 30 },
    { name: "Colágeno Hidrolizado 300g", description: "Colágeno tipo I y III con vitamina C. Articulaciones, piel y cabello.", price: "89000", category: "Suplementos", stock: 45 },
    { name: "Omega 3 EPA/DHA x90", description: "1200mg por cápsula. Corazón, cerebro y articulaciones. Sin olor a pescado.", price: "68000", category: "Suplementos", stock: 60 },
    { name: "Tensiómetro Digital Brazo", description: "Monitor de presión arterial automático. Detección de arritmias. Memoria 60 lecturas.", price: "145000", category: "Dispositivos", stock: 2 },
    { name: "Glucómetro Accu-Check", description: "Medición de glucosa en sangre en 4 segundos. Incluye 25 tiras reactivas.", price: "180000", category: "Dispositivos", stock: 12 },
    { name: "Gel Antibacterial Frasco 500ml", description: "Gel antiséptico con aloe vera y glicerina. 70% etanol. Frasco dispensador.", price: "16000", category: "Asepsia", stock: 200 },
    { name: "Tapabocas Quirúrgico x50", description: "Mascarilla de 3 capas certificada. Color azul. Elástico suave.", price: "18000", category: "Asepsia", stock: 300 },
  ],
  "laureles": [
    { name: "Atorvastatina 20mg x30", description: "Estatina para control del colesterol LDL. Requiere fórmula médica.", price: "32000", category: "Medicamentos", stock: 65 },
    { name: "Losartan 50mg x30", description: "Antihipertensivo. Control de presión arterial alta. Requiere fórmula médica.", price: "28000", category: "Medicamentos", stock: 80 },
    { name: "Cetirizina 10mg x20", description: "Antihistamínico para alergia estacional y urticaria. Efecto 24 horas.", price: "14500", category: "Medicamentos", stock: 100 },
    { name: "Proteína Vegana Vainilla 900g", description: "Blend de proteína de chícharo y arroz integral. Apto veganos. 22g proteína/porción.", price: "115000", category: "Suplementos", stock: 25 },
    { name: "Magnesio Glicinato 400mg x60", description: "Magnesio de alta absorción. Músculo, nervio y sueño profundo.", price: "72000", category: "Suplementos", stock: 40 },
    { name: "Nebulizador Ultrasónico", description: "Nebulización silenciosa para tratamiento respiratorio. Uso pediátrico y adulto.", price: "220000", category: "Dispositivos", stock: 8 },
    { name: "Electrobisturí Frío Crioterapia", description: "Dispositivo de criocirugía para dermatología. Uso profesional.", price: "890000", category: "Dispositivos", stock: 2 },
    { name: "Agua Oxigenada 3% 250ml", description: "Solución cicatrizante y antiséptica para heridas leves.", price: "8500", category: "Asepsia", stock: 160 },
    { name: "Suero Oral Electrolit 500ml", description: "Sales de rehidratación oral. Sabor tropical. Deshidratación por vómito/diarrea.", price: "9500", category: "Medicamentos", stock: 180 },
    { name: "Melatonina 3mg x30", description: "Regulador del ritmo circadiano. Mejora la calidad del sueño de forma natural.", price: "38000", category: "Suplementos", stock: 90 },
  ],
  "belen": [
    { name: "Naproxeno 500mg x20", description: "AINE de acción prolongada. Dolor articular, muscular y dismenorrea.", price: "19500", category: "Medicamentos", stock: 75 },
    { name: "Clonazepam 0.5mg x30", description: "Ansiolítico benzodiazepínico. Requiere fórmula médica especial.", price: "45000", category: "Medicamentos", stock: 20 },
    { name: "Vitamina D3 5000 IU x90", description: "Vitamina D de alta potencia para huesos, inmunidad y ánimo.", price: "55000", category: "Suplementos", stock: 70 },
    { name: "Zinc Quelado 25mg x60", description: "Mineral esencial para inmunidad, piel y función reproductiva.", price: "42000", category: "Suplementos", stock: 55 },
    { name: "Estetoscopio Littmann Classic", description: "Estetoscopio clásico doble campana. Tubo 27 pulgadas. Médicos y enfermería.", price: "350000", category: "Dispositivos", stock: 5 },
    { name: "Oxímetro de Pulso Portátil", description: "Medición SpO2 y frecuencia cardíaca. Display OLED. Batería AAA.", price: "62000", category: "Dispositivos", stock: 18 },
    { name: "Algodón Hidrófilo 200g", description: "Algodón puro 100%. Uso clínico y cosmético. Rollo empacado al vacío.", price: "12500", category: "Asepsia", stock: 220 },
    { name: "Esparadrapo 10m x 2.5cm", description: "Cinta adhesiva médica microporosa. Alta adherencia. No irrita la piel.", price: "8000", category: "Asepsia", stock: 350 },
    { name: "Jeringa 5ml x10", description: "Jeringas desechables estériles con aguja 21G. Embalaje individual.", price: "22000", category: "Asepsia", stock: 400 },
    { name: "Glucosamina + Condroitina 60 tab", description: "Condroprotector articular con vitamina C. Artritis y osteoporosis.", price: "95000", category: "Suplementos", stock: 35 },
  ],
  "envigado": [
    { name: "Tramadol 50mg x10", description: "Analgésico opioide de acción central. Dolor moderado a severo. Fórmula médica.", price: "38000", category: "Medicamentos", stock: 15 },
    { name: "Alprazolam 0.25mg x30", description: "Ansiolítico. Trastorno de ansiedad generalizada. Fórmula médica especial.", price: "52000", category: "Medicamentos", stock: 10 },
    { name: "Insulina Glargina 100u 10ml", description: "Insulina de acción prolongada para diabetes tipo 1 y 2. Refrigerar.", price: "185000", category: "Medicamentos", stock: 8 },
    { name: "Creatina Monohidrato 500g", description: "Creatina micronizada de calidad farmacéutica. Sabor natural. Fuerza y recuperación.", price: "98000", category: "Suplementos", stock: 40 },
    { name: "Pre-workout BCAA 300g", description: "Aminoácidos de cadena ramificada L-Leucina, L-Isoleucina, L-Valina 2:1:1.", price: "82000", category: "Suplementos", stock: 30 },
    { name: "Tensiómetro Muñeca Automático", description: "Monitor de presión arterial de muñeca. Pantalla LED retroiluminada. Memoria 60.", price: "89000", category: "Dispositivos", stock: 15 },
    { name: "Báscula Médica Digital", description: "Báscula de piso con tallímetro. Capacidad 200kg. Precisión 100g.", price: "650000", category: "Dispositivos", stock: 3 },
    { name: "Vendaje Elástico 10cm x4.5m", description: "Venda de crepé elástica para inmovilización y compresión.", price: "11500", category: "Asepsia", stock: 280 },
    { name: "Bisturí Desechable #22 x10", description: "Bisturí estéril de acero inoxidable carbono. Uso quirúrgico y dermatológico.", price: "35000", category: "Asepsia", stock: 120 },
    { name: "L-Carnitina 3000 500ml", description: "Quemador de grasa y energizante. Sabor naranja. Apto deportistas.", price: "68000", category: "Suplementos", stock: 50 },
  ],
  "bello": [
    { name: "Metoclopramida 10mg x20", description: "Antinauseoso y procinético. Vómito, náuseas y reflujo.", price: "12000", category: "Medicamentos", stock: 110 },
    { name: "Azitromicina 500mg x3", description: "Antibiótico macrólido. Infecciones respiratorias y de tejidos blandos. Fórmula médica.", price: "42000", category: "Medicamentos", stock: 30 },
    { name: "Dexametasona 4mg/2ml amp", description: "Corticoesteroide inyectable. Inflamación severa y alergia grave. Fórmula médica.", price: "8500", category: "Medicamentos", stock: 60 },
    { name: "Hierro Ferroso + Ácido Fólico x30", description: "Suplemento para anemia ferropénica y embarazo. Alta biodisponibilidad.", price: "32000", category: "Suplementos", stock: 85 },
    { name: "Calcio + Vitamina D3 x60", description: "Carbonato de calcio 600mg con vitamina D3. Huesos, dientes y corazón.", price: "48000", category: "Suplementos", stock: 70 },
    { name: "Equipo de Venoclisis IV", description: "Set de venopunción con macroclise 1.2m. Estéril desechable.", price: "8000", category: "Asepsia", stock: 500 },
    { name: "Catéter Intravenoso 18G x10", description: "Catéter periférico con cámara de visualización. Talla 18G (verde).", price: "35000", category: "Asepsia", stock: 200 },
    { name: "Tensiómetro Aneroide", description: "Tensiómetro de columna de mercurio-libre. Clínica y uso profesional.", price: "125000", category: "Dispositivos", stock: 10 },
    { name: "Silla de Ruedas Plegable", description: "Silla de ruedas de acero con apoyabrazos desmontables. Capacidad 100kg.", price: "650000", category: "Dispositivos", stock: 4 },
    { name: "Melatonina + Pasiflora x60", description: "Fórmula natural para el sueño. Melatonina 5mg + extracto de pasiflora.", price: "52000", category: "Suplementos", stock: 65 },
  ],
  "robledo": [
    { name: "Ranitidina 150mg x20", description: "Antiulceroso H2. Úlceras pépticas y gastritis. Uso corto plazo.", price: "16500", category: "Medicamentos", stock: 95 },
    { name: "Furosemida 40mg x30", description: "Diurético de asa. Edemas e hipertensión. Fórmula médica.", price: "18000", category: "Medicamentos", stock: 45 },
    { name: "Ciprofloxacino 500mg x10", description: "Antibiótico quinolona. Infecciones urinarias y gastrointestinales. Fórmula médica.", price: "28000", category: "Medicamentos", stock: 35 },
    { name: "Probiótico Florastor 20 cáps", description: "Saccharomyces boulardii CNCM I-745. Flora intestinal y post-antibiótico.", price: "68000", category: "Suplementos", stock: 40 },
    { name: "Ashwagandha 600mg x60", description: "Adaptógeno para estrés, cortisol y energía. Extracto KSM-66 patentado.", price: "78000", category: "Suplementos", stock: 35 },
    { name: "Lámpara de Fototerapia UV-B", description: "Tratamiento domiciliario para psoriasis y vitíligo. 311nm UV-B de banda estrecha.", price: "1250000", category: "Dispositivos", stock: 2 },
    { name: "Caminador Andador Plegable", description: "Andador aluminio con ruedas frontales y asiento. Plegable. Peso 6.5kg.", price: "285000", category: "Dispositivos", stock: 6 },
    { name: "Sutura Seda 2-0 x12", description: "Sutura no reabsorbible trenzada. Aguja curva 3/8. Cirugía de tejidos.", price: "42000", category: "Asepsia", stock: 80 },
    { name: "Crema Hidratante Urea 10% 200g", description: "Hidratante corporal intensivo para piel seca y escamosa. Uso dermatológico.", price: "38000", category: "Medicamentos", stock: 120 },
    { name: "Berberina 500mg x60", description: "Extracto de berberina para control de glucosa y colesterol. Certificado GMP.", price: "85000", category: "Suplementos", stock: 45 },
  ],
  "itagui": [
    { name: "Clindamicina 300mg x16", description: "Antibiótico lincosamida. Infecciones de piel y tejidos blandos. Fórmula médica.", price: "48000", category: "Medicamentos", stock: 28 },
    { name: "Ketoprofeno 100mg x20", description: "AINE tópico y oral. Dolor agudo posquirúrgico y traumatológico.", price: "24000", category: "Medicamentos", stock: 70 },
    { name: "Salbutamol Inhalador 200 dosis", description: "Broncodilatador beta-2 agonista de acción corta. Asma y EPOC. Fórmula médica.", price: "55000", category: "Medicamentos", stock: 20 },
    { name: "Collagen Peptides Marine 200g", description: "Colágeno marino hidrolizado tipo I. Bajo peso molecular. Mezcla fácil en agua.", price: "95000", category: "Suplementos", stock: 30 },
    { name: "Curcumina + Piperina 500mg x60", description: "Turmeric con bioperina para mayor absorción. Antiinflamatorio natural.", price: "72000", category: "Suplementos", stock: 50 },
    { name: "Desfibrilador AED Portátil", description: "Desfibrilador automático externo para primeros auxilios. Incluye electrodos adulto.", price: "4500000", category: "Dispositivos", stock: 1 },
    { name: "Bota Ortopédica Tobillo", description: "Inmovilizador de tobillo con soporte lateral. Ajustable. Lesiones ligamentosas.", price: "195000", category: "Dispositivos", stock: 12 },
    { name: "Yeso Ortopédico x4 rollos", description: "Vendaje enyesado de fraguado rápido. Rollo 15cm x4.5m.", price: "28000", category: "Asepsia", stock: 150 },
    { name: "Crema Antipruriginosa Fenergan 60g", description: "Prometazina tópica. Picaduras, urticaria y prurito de contacto.", price: "29000", category: "Medicamentos", stock: 85 },
    { name: "L-Glutamina 500g", description: "Aminoácido para recuperación muscular e integridad intestinal. Sabor natural.", price: "78000", category: "Suplementos", stock: 40 },
  ],
  "sabaneta": [
    { name: "Esomeprazol 40mg x14", description: "IBP de última generación. Reflujo gastroesofágico erosivo y úlcera duodenal.", price: "58000", category: "Medicamentos", stock: 50 },
    { name: "Enalapril 10mg x30", description: "IECA antihipertensivo. Insuficiencia cardíaca e hipertensión. Fórmula médica.", price: "22000", category: "Medicamentos", stock: 60 },
    { name: "Coenzima Q10 200mg x30", description: "Antioxidante mitocondrial. Energía celular y salud cardiovascular.", price: "88000", category: "Suplementos", stock: 35 },
    { name: "NMN 500mg x60", description: "Nicotinamida mononucleótido. Longevidad, NAD+ y energía celular.", price: "185000", category: "Suplementos", stock: 15 },
    { name: "Monitor Holter 24h", description: "Monitor cardíaco portátil de 24 horas. Detección de arritmias. Uso clínico.", price: "2800000", category: "Dispositivos", stock: 2 },
    { name: "Medias de Compresión 20-30mmHg", description: "Medias de compresión médica para varices y edemas. Talla M. Color beige.", price: "85000", category: "Dispositivos", stock: 25 },
    { name: "Lancetas Accu-Check x100", description: "Lancetas estériles 28G para punción capilar. Compatibles con todos los glucómetros.", price: "18000", category: "Asepsia", stock: 300 },
    { name: "Liposoma Vitamina C 1000mg x60", description: "Vitamina C liposomal de alta biodisponibilidad. Antioxidante y anti-aging.", price: "145000", category: "Suplementos", stock: 20 },
    { name: "Loción Sunblock SPF50+ 200ml", description: "Protector solar mineral SPF50+. Resistente al agua 80min. Zinc óxido.", price: "65000", category: "Medicamentos", stock: 80 },
    { name: "Probiótico Lactobacillus 10B x30", description: "Multi-cepa 10 billones UFC. Digestión, inmunidad y flora vaginal.", price: "75000", category: "Suplementos", stock: 45 },
  ],
  "calasanz": [
    { name: "Fluconazol 150mg x1", description: "Antifúngico sistémico para candidiasis vaginal y oral. Dosis única.", price: "28000", category: "Medicamentos", stock: 55 },
    { name: "Clotrimazol Crema 1% 30g", description: "Antifúngico tópico para micosis cutánea, pie de atleta y candidiasis.", price: "15500", category: "Medicamentos", stock: 90 },
    { name: "Eritropoyetina Humana 4000UI", description: "EPO recombinante para anemia renal crónica. Inyectable. Cadena de frío.", price: "385000", category: "Medicamentos", stock: 6 },
    { name: "Spirulina Orgánica 500g polvo", description: "Microalga superfood. Proteína completa 65%, hierro, vitamina B12.", price: "95000", category: "Suplementos", stock: 30 },
    { name: "Glucosamina Condroitina MSM x90", description: "Triple acción articular. Glucosamina 500mg + Condroitina 400mg + MSM 400mg.", price: "105000", category: "Suplementos", stock: 40 },
    { name: "Lámpara de Calor Infrarrojo", description: "Terapia de calor infrarrojo lejano. Dolor muscular crónico y artritis.", price: "285000", category: "Dispositivos", stock: 7 },
    { name: "TENS EMS Digital 4 canales", description: "Electroestimulador neuromuscular TENS/EMS. Rehabilitación y dolor crónico.", price: "195000", category: "Dispositivos", stock: 10 },
    { name: "Gel de Aloe Vera Puro 500ml", description: "Aloe vera orgánico 99.5% puro. Quemaduras, hidratación y cicatrización.", price: "32000", category: "Asepsia", stock: 100 },
    { name: "Ketamina Tópica Crema 10% 50g", description: "Anestésico tópico para neuralgia y dolor crónico. Uso especializado.", price: "125000", category: "Medicamentos", stock: 12 },
    { name: "Vinagre de Manzana Orgánico 500ml", description: "Vinagre de manzana sin filtrar con la madre. Digestión y glucemia.", price: "28000", category: "Suplementos", stock: 60 },
  ],
  "laestrella": [
    { name: "Warfarina 5mg x30", description: "Anticoagulante oral. Control de trombosis venosa y embolia. Fórmula médica.", price: "18000", category: "Medicamentos", stock: 25 },
    { name: "Levotiroxina 50mcg x30", description: "Hormona tiroidea sintética. Hipotiroidismo. Fórmula médica.", price: "24000", category: "Medicamentos", stock: 40 },
    { name: "Hidrocortisona Crema 1% 30g", description: "Corticoesteroide tópico leve para eczema, dermatitis y picaduras.", price: "18500", category: "Medicamentos", stock: 75 },
    { name: "Hierro Quelado 45mg x60", description: "Bisglicinato de hierro sin efecto estreñimiento. Anemia. Alta tolerancia gástrica.", price: "58000", category: "Suplementos", stock: 50 },
    { name: "Vitamina B12 Metilcobalamina 1mg x60", description: "Metilcobalamina activa. Energía, nervios y producción de glóbulos rojos.", price: "62000", category: "Suplementos", stock: 55 },
    { name: "Silla de Ruedas Eléctrica", description: "Silla eléctrica plegable. Motor 24V. Autonomía 25km. Peso 18kg.", price: "8500000", category: "Dispositivos", stock: 1 },
    { name: "Muletas Axilares Aluminio par", description: "Muletas ajustables de aluminio. Altura 135-185cm. Capacidad 120kg.", price: "165000", category: "Dispositivos", stock: 14 },
    { name: "Gasas Estériles 10x10 x100", description: "Apósitos de gasa no tejida estéril. Heridas, quemaduras y desbridamiento.", price: "42000", category: "Asepsia", stock: 250 },
    { name: "Silica Gel Reductor 200g", description: "Dióxido de silicio coloidal micronizado para articulaciones y metabolismo.", price: "68000", category: "Suplementos", stock: 35 },
    { name: "Crema Anticelulitica 250ml", description: "Cafeína 5% + retinol + centella asiática. Reductora y reafirmante.", price: "78000", category: "Medicamentos", stock: 60 },
  ],
};

async function ensureAllStores() {
  for (const store of ALL_STORES) {
    const result = await pool.query(
      `SELECT id FROM stores WHERE email = $1`,
      [store.email]
    );
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO stores (name, address, phone, email, lat, lng, active, description, open_hours, total_sales, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,now())`,
        [store.name, store.address, store.phone, store.email, store.lat, store.lng, store.active, store.description, store.open_hours]
      );
      logger.info(`Store ensured: ${store.name}`);
    } else {
      // Update coordinates to real values
      await pool.query(
        `UPDATE stores SET lat=$1, lng=$2, open_hours=$3, description=$4 WHERE email=$5`,
        [store.lat, store.lng, store.open_hours, store.description, store.email]
      );
    }
  }
  logger.info("All stores ensured with real Medellín GPS coordinates");
}

async function ensureAllProducts() {
  const zoneKeys: Array<[string, string]> = [
    ["norte@distri.co", "norte"],
    ["poblado@distri.co", "poblado"],
    ["laureles@distri.co", "laureles"],
    ["belen@distri.co", "belen"],
    ["envigado@distri.co", "envigado"],
    ["bello@distri.co", "bello"],
    ["robledo@distri.co", "robledo"],
    ["itagui@distri.co", "itagui"],
    ["sabaneta@distri.co", "sabaneta"],
    ["calasanz@distri.co", "calasanz"],
    ["laestrella@distri.co", "laestrella"],
  ];

  for (const [email, zone] of zoneKeys) {
    const storeResult = await pool.query(`SELECT id FROM stores WHERE email = $1`, [email]);
    if (storeResult.rows.length === 0) continue;
    const storeId = storeResult.rows[0].id;

    const existing = await pool.query(`SELECT COUNT(*) FROM products WHERE store_id = $1`, [storeId]);
    if (parseInt(existing.rows[0].count) >= 5) continue;

    const catalog = PRODUCTS_CATALOG[zone] || [];
    for (const p of catalog) {
      await pool.query(
        `INSERT INTO products (name, description, price, category, stock, store_id, active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,true,now())
         ON CONFLICT DO NOTHING`,
        [p.name, p.description, p.price, p.category, p.stock, storeId]
      );
    }
    logger.info(`Products ensured for ${zone}: ${catalog.length} items`);
  }
}

async function autoSeedIfEmpty() {
  try {
    const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
    if (existing.length > 0) return;

    logger.info("Database is empty — running initial seed...");

    const [store1, store2] = await db.insert(storesTable).values(
      ALL_STORES.map(s => ({
        name: s.name, address: s.address, phone: s.phone, email: s.email,
        lat: s.lat, lng: s.lng, active: s.active, description: s.description,
      }))
    ).returning();

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

    logger.info("Initial seed complete — demo accounts ready");
  } catch (err) {
    logger.warn({ err }, "Auto-seed skipped or failed (tables may not exist yet)");
  }
}

ensureSchema()
  .then(() => ensureSettings())
  .then(() => autoSeedIfEmpty())
  .then(() => ensureAllStores())
  .then(() => ensureAllProducts())
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
