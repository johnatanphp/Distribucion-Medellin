import { db } from "@workspace/db";
import { usersTable, storesTable, productsTable, salesTable, ratingsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding DISTRIMED database (Medellín completo)...");

  await db.execute(sql`TRUNCATE ratings, sales, products, users, stores RESTART IDENTITY CASCADE`);

  // ─── 10 tiendas por toda el Área Metropolitana de Medellín ───
  const stores = await db.insert(storesTable).values([
    {
      name: "Distrimed Norte – Aranjuez",
      address: "Calle 92 #52-30, Barrio Aranjuez, Medellín",
      phone: "3001234567",
      email: "norte@distri.co",
      lat: 6.2907,
      lng: -75.5748,
      active: true,
      description: "Sucursal norte especializada en medicamentos genéricos y de consumo masivo.",
    },
    {
      name: "Distrimed Poblado",
      address: "Av. El Poblado #10-30, Medellín",
      phone: "3007654321",
      email: "poblado@distri.co",
      lat: 6.2099,
      lng: -75.5680,
      active: true,
      description: "Sucursal premium en El Poblado con productos importados y suplementos deportivos.",
    },
    {
      name: "Distrimed Centro – Alpujarra",
      address: "Carrera 52 #48-31, Alpujarra, Medellín",
      phone: "3009876543",
      email: "centro@distri.co",
      lat: 6.2518,
      lng: -75.5636,
      active: false,
      description: "Sucursal céntrica. Temporalmente suspendida por remodelación.",
    },
    {
      name: "Distrimed Laureles",
      address: "Circular 74 #39-15, Laureles, Medellín",
      phone: "3012345678",
      email: "laureles@distri.co",
      lat: 6.2445,
      lng: -75.5928,
      active: true,
      description: "Sucursal en el corazón de Laureles. Especializada en dispositivos médicos y asepsia.",
    },
    {
      name: "Distrimed Belén",
      address: "Calle 30 Sur #76-10, Belén, Medellín",
      phone: "3023456789",
      email: "belen@distri.co",
      lat: 6.2265,
      lng: -75.6005,
      active: true,
      description: "Atendemos el sur-occidente de Medellín. Gran variedad en suplementos y vitaminas.",
    },
    {
      name: "Distrimed Envigado",
      address: "Calle 37 Sur #43-22, Envigado",
      phone: "3034567890",
      email: "envigado@distri.co",
      lat: 6.1742,
      lng: -75.5913,
      active: true,
      description: "Punto de distribución para Envigado y municipios del sur del Área Metropolitana.",
    },
    {
      name: "Distrimed Robledo",
      address: "Cra 80 #65B-12, Robledo, Medellín",
      phone: "3045678901",
      email: "robledo@distri.co",
      lat: 6.2752,
      lng: -75.6058,
      active: true,
      description: "Sucursal occidente. Cobertura para Robledo, Castilla y Kennedy.",
    },
    {
      name: "Distrimed Itagüí",
      address: "Calle 37 #43-20, Itagüí",
      phone: "3056789012",
      email: "itagui@distri.co",
      lat: 6.1844,
      lng: -75.5997,
      active: true,
      description: "Atiende el municipio de Itagüí y sector industrial del sur.",
    },
    {
      name: "Distrimed Bello",
      address: "Calle 48 #51-30, Barrio Zamora, Bello",
      phone: "3067890123",
      email: "bello@distri.co",
      lat: 6.3338,
      lng: -75.5555,
      active: true,
      description: "La más grande del norte metropolitano. Medicamentos, dispositivos y más.",
    },
    {
      name: "Distrimed Sabaneta",
      address: "Parque Principal, Sabaneta",
      phone: "3078901234",
      email: "sabaneta@distri.co",
      lat: 6.1506,
      lng: -75.6166,
      active: false,
      description: "Próxima apertura en Sabaneta. En fase de instalación.",
    },
  ]).returning();

  const [s_norte, s_poblado, s_centro, s_laureles, s_belen, s_envigado, s_robledo, s_itagui, s_bello, s_sabaneta] = stores;

  // ─── Contraseñas ───
  const [adminHash, tiendaHash, passHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("tienda123", 10),
    bcrypt.hash("pass123", 10),
  ]);

  // ─── Usuarios ───
  const [admin, carlosNorte, anaPoblado, pedroR, mariaG] = await db.insert(usersTable).values([
    { email: "admin@distri.co", password: adminHash, name: "Admin DISTRIMED", role: "superadmin", active: true },
    { email: "norte@distri.co", password: tiendaHash, name: "Carlos Norte", role: "store", storeId: s_norte.id, active: true },
    { email: "poblado@distri.co", password: tiendaHash, name: "Ana Poblado", role: "store", storeId: s_poblado.id, active: true },
    { email: "pedro@gmail.com", password: passHash, name: "Pedro Ramírez", role: "customer", active: true },
    { email: "maria@gmail.com", password: passHash, name: "María García", role: "customer", active: true },
  ]).returning();

  // ─── Productos por tienda ───
  const [p1, p2, p3, p4, p5] = await db.insert(productsTable).values([
    { name: "Acetaminofén 500mg", description: "Analgésico y antipirético, caja x100 tabletas. Alivio rápido del dolor.", price: "18500", category: "Medicamentos", stock: 150, storeId: s_norte.id, active: true },
    { name: "Ibuprofeno 400mg", description: "Antiinflamatorio no esteroideo, caja x50 tabletas.", price: "22000", category: "Medicamentos", stock: 80, storeId: s_norte.id, active: true },
    { name: "Vitamina C 1000mg", description: "Suplemento vitamínico de alta potencia, frasco x60 cápsulas.", price: "35000", category: "Suplementos", stock: 60, storeId: s_norte.id, active: true },
    { name: "Alcohol Antiséptico 500ml", description: "Alcohol isopropílico al 70% para uso externo y antisepsia.", price: "12000", category: "Asepsia", stock: 3, storeId: s_norte.id, active: true },
    { name: "Termómetro Digital Infrarojo", description: "Medición sin contacto de alta precisión, batería incluida.", price: "45000", category: "Dispositivos", stock: 25, storeId: s_norte.id, active: true },
  ]).returning();

  const [p6, p7, p8, p9, p10] = await db.insert(productsTable).values([
    { name: "Omeprazol 20mg", description: "Inhibidor de bomba de protones, caja x30 cápsulas. Gastritis y reflujo.", price: "28000", category: "Medicamentos", stock: 90, storeId: s_poblado.id, active: true },
    { name: "Loratadina 10mg", description: "Antihistamínico de segunda generación, caja x20 tabletas.", price: "15000", category: "Medicamentos", stock: 120, storeId: s_poblado.id, active: true },
    { name: "Proteína Whey Premium 1kg", description: "Suplemento proteico sabor vainilla, 30g de proteína por porción.", price: "89000", category: "Suplementos", stock: 30, storeId: s_poblado.id, active: true },
    { name: "Tensiómetro Digital Automático", description: "Monitor de presión arterial de brazo con pantalla LCD.", price: "120000", category: "Dispositivos", stock: 2, storeId: s_poblado.id, active: true },
    { name: "Gel Antibacterial 500ml", description: "Desinfectante de manos con aloe vera y vitamina E.", price: "16000", category: "Asepsia", stock: 200, storeId: s_poblado.id, active: true },
  ]).returning();

  const [p11, p12, p13] = await db.insert(productsTable).values([
    { name: "Naproxeno 500mg", description: "Antiinflamatorio para dolor muscular y articular, x24 tabletas.", price: "19500", category: "Medicamentos", stock: 70, storeId: s_laureles.id, active: true },
    { name: "Multivitamínico Completo", description: "Vitaminas A, B, C, D, E y minerales esenciales, x60 tabletas.", price: "42000", category: "Suplementos", stock: 45, storeId: s_laureles.id, active: true },
    { name: "Oxímetro de Pulso Digital", description: "Sensor de SpO2 y frecuencia cardíaca, pantalla OLED.", price: "55000", category: "Dispositivos", stock: 18, storeId: s_laureles.id, active: true },
  ]).returning();

  const [p14, p15] = await db.insert(productsTable).values([
    { name: "Clonazepam 0.5mg (Venta con fórmula)", description: "Benzodiacepina de uso controlado, x30 tabletas.", price: "32000", category: "Medicamentos", stock: 20, storeId: s_belen.id, active: true },
    { name: "Creatina Monohidrato 500g", description: "Suplemento para rendimiento deportivo, sabor neutro.", price: "65000", category: "Suplementos", stock: 25, storeId: s_belen.id, active: true },
  ]).returning();

  const [p16, p17] = await db.insert(productsTable).values([
    { name: "Metformina 850mg", description: "Antidiabético oral de primera línea, x60 tabletas.", price: "24000", category: "Medicamentos", stock: 55, storeId: s_envigado.id, active: true },
    { name: "Tapabocas KN95 x10 unidades", description: "Mascarilla de alta filtración certificada, paquete x10.", price: "28000", category: "Asepsia", stock: 80, storeId: s_envigado.id, active: true },
  ]).returning();

  const [p18, p19] = await db.insert(productsTable).values([
    { name: "Ciprofloxacina 500mg", description: "Antibiótico de amplio espectro, x12 cápsulas (requiere fórmula).", price: "38000", category: "Medicamentos", stock: 40, storeId: s_robledo.id, active: true },
    { name: "Glucómetro Digital + 25 tiras", description: "Kit de monitoreo de glucemia en sangre completo.", price: "85000", category: "Dispositivos", stock: 12, storeId: s_robledo.id, active: true },
  ]).returning();

  const [p20] = await db.insert(productsTable).values([
    { name: "Atorvastatina 40mg", description: "Reductor de colesterol LDL, x30 tabletas.", price: "35000", category: "Medicamentos", stock: 60, storeId: s_itagui.id, active: true },
  ]).returning();

  const [p21, p22] = await db.insert(productsTable).values([
    { name: "Amoxicilina 500mg", description: "Antibiótico penicilínico de amplio espectro, x21 cápsulas.", price: "21000", category: "Medicamentos", stock: 95, storeId: s_bello.id, active: true },
    { name: "Jarabe Ambroxol 30mg/5ml", description: "Expectorante y mucolítico, frasco x120ml.", price: "18000", category: "Medicamentos", stock: 50, storeId: s_bello.id, active: true },
  ]).returning();

  // ─── Ventas históricas (30 días) ───
  const now = new Date();
  const allProducts = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22];
  const activeProdsByStore: Record<number, typeof allProducts> = {
    [s_norte.id]: [p1, p2, p3, p4, p5],
    [s_poblado.id]: [p6, p7, p8, p9, p10],
    [s_laureles.id]: [p11, p12, p13],
    [s_belen.id]: [p14, p15],
    [s_envigado.id]: [p16, p17],
    [s_robledo.id]: [p18, p19],
    [s_itagui.id]: [p20],
    [s_bello.id]: [p21, p22],
  };

  const activeStoreIds = [s_norte.id, s_poblado.id, s_laureles.id, s_belen.id, s_envigado.id, s_robledo.id, s_itagui.id, s_bello.id];
  const salesData: any[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const storeId = activeStoreIds[i % activeStoreIds.length];
    const prods = activeProdsByStore[storeId] || [p1];
    const numSales = Math.floor(Math.random() * 4) + 1;
    for (let s = 0; s < numSales; s++) {
      const prod = prods[Math.floor(Math.random() * prods.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      salesData.push({
        productId: prod.id,
        storeId,
        userId: s % 2 === 0 ? pedroR.id : mariaG.id,
        quantity: qty,
        amount: String(Number(prod.price) * qty),
        createdAt: date,
      });
    }
  }
  await db.insert(salesTable).values(salesData);

  // ─── Valoraciones ───
  await db.insert(ratingsTable).values([
    { productId: p1.id, userId: pedroR.id, stars: 5, comment: "Excelente, muy efectivo para el dolor de cabeza" },
    { productId: p1.id, userId: mariaG.id, stars: 4, comment: "Buen precio y calidad garantizada" },
    { productId: p2.id, userId: pedroR.id, stars: 4, comment: "Funciona bien para el dolor muscular" },
    { productId: p3.id, userId: mariaG.id, stars: 5, comment: "Lo pido siempre, excelente para las defensas" },
    { productId: p6.id, userId: pedroR.id, stars: 5, comment: "Muy bueno para la gastritis crónica" },
    { productId: p8.id, userId: mariaG.id, stars: 3, comment: "Regular, prefiero otra marca de proteína" },
    { productId: p9.id, userId: pedroR.id, stars: 5, comment: "Muy preciso y fácil de usar en casa" },
    { productId: p11.id, userId: mariaG.id, stars: 4, comment: "Bueno para el dolor de rodilla" },
    { productId: p13.id, userId: pedroR.id, stars: 5, comment: "El oxímetro más preciso que he probado" },
    { productId: p18.id, userId: mariaG.id, stars: 4, comment: "Entrega rápida y producto original" },
  ]);

  console.log(`✅ Seed completo:`);
  console.log(`   - 10 tiendas (8 activas, 2 inactivas) distribuidas en el Área Metropolitana`);
  console.log(`   - 5 usuarios (1 admin, 2 tienda, 2 cliente)`);
  console.log(`   - 22 productos en 8 tiendas`);
  console.log(`   - ${salesData.length} ventas (30 días de historial)`);
  console.log(`   - 10 valoraciones`);
  console.log(`\n🔑 Credenciales demo:`);
  console.log(`   Admin:    admin@distri.co   / admin123`);
  console.log(`   Tienda 1: norte@distri.co   / tienda123`);
  console.log(`   Tienda 2: poblado@distri.co / tienda123`);
  console.log(`   Cliente:  pedro@gmail.com   / pass123`);
  console.log(`   Cliente:  maria@gmail.com   / pass123`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
