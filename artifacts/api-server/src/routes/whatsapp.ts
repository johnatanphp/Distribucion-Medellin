import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable, storesTable, settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getSetting(key: string): Promise<string | null> {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? await getSetting("whatsapp_account_sid");
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? await getSetting("whatsapp_auth_token");
  const from = process.env.TWILIO_WHATSAPP_FROM ?? await getSetting("whatsapp_from") ?? "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to.startsWith("+") ? to : "+" + to}`;

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: toFormatted, Body: message }).toString(),
      }
    );
    const data = await resp.json() as any;
    if (!resp.ok) return { success: false, error: data.message ?? "Twilio error" };
    return { success: true, sid: data.sid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

router.post("/send", async (req, res) => {
  const { to, message, storeId, userId, type } = req.body;
  if (!to || !message) return res.status(400).json({ error: "bad_request", message: "to and message are required" });

  const result = await sendWhatsApp(to, message);

  await db.insert(notificationsTable).values({
    userId: userId ?? null,
    storeId: storeId ?? null,
    title: "WhatsApp enviado",
    body: message.substring(0, 200),
    type: type ?? "whatsapp",
    channel: "whatsapp",
    read: true,
    data: JSON.stringify({ to, ...result }),
  });

  if (!result.success) return res.status(502).json({ error: "whatsapp_error", message: result.error });
  res.json({ success: true, sid: result.sid });
});

router.post("/order-notification", async (req, res) => {
  const { orderId, storeId, customerName, total, items } = req.body;
  if (!orderId || !storeId) return res.status(400).json({ error: "bad_request" });

  const [store] = await db.select().from(storesTable).where(eq(storesTable.id, parseInt(storeId, 10)));
  if (!store?.whatsappPhone) {
    return res.json({ success: false, reason: "Store has no WhatsApp phone configured" });
  }

  const itemList = Array.isArray(items)
    ? items.map((i: any) => `• ${i.name} x${i.quantity} = $${i.total?.toLocaleString("es-CO")}`).join("\n")
    : "";

  const message = `🏥 *DISTRIMED - Nuevo Pedido #${orderId}*\n\n👤 Cliente: ${customerName ?? "N/A"}\n💰 Total: $${Number(total).toLocaleString("es-CO")} COP\n\n📦 Productos:\n${itemList}\n\n✅ Por favor confirme el pedido en el sistema.`;

  const result = await sendWhatsApp(store.whatsappPhone, message);

  await db.insert(notificationsTable).values({
    storeId: store.id,
    title: `Pedido #${orderId} notificado`,
    body: `Notificación WhatsApp enviada a ${store.whatsappPhone}`,
    type: "order",
    channel: "whatsapp",
    read: false,
    data: JSON.stringify({ orderId, result }),
  });

  res.json(result);
});

router.post("/webhook", async (req, res) => {
  const { Body, From, To, NumMedia } = req.body;

  const lowerBody = (Body ?? "").toLowerCase().trim();
  let replyMessage = "Gracias por contactar a *DISTRIMED*. Para pedidos y consultas, visita nuestra app.";

  if (lowerBody.includes("hola") || lowerBody.includes("buenas") || lowerBody.includes("buenos")) {
    replyMessage = "¡Hola! 👋 Bienvenido a *DISTRIMED* 🏥\n\nPuedo ayudarte con:\n• *pedido* - Consultar pedidos\n• *tiendas* - Ver sucursales\n• *catalogo* - Ver productos\n\n¿Qué necesitas?";
  } else if (lowerBody.includes("pedido") || lowerBody.includes("orden")) {
    replyMessage = "Para consultar tus pedidos, ingresa a nuestra app en:\n🌐 distrimed.replit.app\n\nO escríbenos tu número de pedido.";
  } else if (lowerBody.includes("tienda") || lowerBody.includes("sucursal")) {
    replyMessage = "📍 Nuestras sucursales en Medellín:\n• Norte – Aranjuez\n• El Poblado\n• Laureles\n• Belén\n• Envigado\n\nVisita la app para ver direcciones y horarios.";
  } else if (lowerBody.includes("catalogo") || lowerBody.includes("producto")) {
    replyMessage = "🛒 Visita nuestro catálogo completo en la app:\n🌐 distrimed.replit.app\n\nEncuentra medicamentos, dispositivos médicos, suplementos y más.";
  } else if (lowerBody.includes("precio") || lowerBody.includes("costo")) {
    replyMessage = "💰 Los precios actualizados están en nuestra app:\n🌐 distrimed.replit.app/customer/catalog";
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? await getSetting("whatsapp_account_sid");
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? await getSetting("whatsapp_auth_token");
  const from = process.env.TWILIO_WHATSAPP_FROM ?? await getSetting("whatsapp_from") ?? "whatsapp:+14155238886";

  if (accountSid && authToken) {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: from, To: From, Body: replyMessage }).toString(),
      }
    ).catch(() => {});
  }

  res.set("Content-Type", "text/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

export { sendWhatsApp };
export default router;
