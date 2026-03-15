import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import nodemailer from "nodemailer";
import cron from "node-cron";
import twilio from "twilio";
import { runSecurityAudit, runSystemTests } from "./src/securityTests.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");
db.pragma("foreign_keys = ON");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    cnpj TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    type TEXT,
    issue_date TEXT,
    expiry_date TEXT,
    file_url TEXT,
    renewal_url TEXT,
    FOREIGN KEY(company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER,
    company_id INTEGER,
    type TEXT,
    file_url TEXT,
    FOREIGN KEY(license_id) REFERENCES licenses(id),
    FOREIGN KEY(company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run("admin@example.com", "admin123", "admin");
  db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run("user@example.com", "user123", "user");

  // Seed Companies
  const c1 = db.prepare("INSERT INTO companies (name, cnpj) VALUES (?, ?)").run("Indústria Alpha Ltda", "12.345.678/0001-90");
  const c2 = db.prepare("INSERT INTO companies (name, cnpj) VALUES (?, ?)").run("Logística Beta S.A.", "98.765.432/0001-10");

  // Seed Licenses
  db.prepare("INSERT INTO licenses (company_id, type, issue_date, expiry_date, file_url, renewal_url) VALUES (?, ?, ?, ?, ?, ?)").run(
    c1.lastInsertRowid, 
    "CETESB", 
    "2023-01-01", 
    "2026-01-01", 
    "https://example.com/license1.pdf", 
    "https://cetesb.sp.gov.br"
  );
  db.prepare("INSERT INTO licenses (company_id, type, issue_date, expiry_date, file_url, renewal_url) VALUES (?, ?, ?, ?, ?, ?)").run(
    c1.lastInsertRowid, 
    "Polícia Federal", 
    "2024-05-15", 
    "2026-04-10", 
    "https://example.com/license2.pdf", 
    "https://www.gov.br/pf"
  );
  db.prepare("INSERT INTO licenses (company_id, type, issue_date, expiry_date, file_url, renewal_url) VALUES (?, ?, ?, ?, ?, ?)").run(
    c2.lastInsertRowid, 
    "IBAMA", 
    "2023-10-20", 
    "2026-03-20", 
    "https://example.com/license3.pdf", 
    "https://www.gov.br/ibama"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    
    // Validação de Input
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: "Email e senha são obrigatórios e devem ser strings" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json({ id: user.id, email: user.email, role: user.role });
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  app.get("/api/companies", (req, res) => {
    const companies = db.prepare("SELECT * FROM companies").all();
    res.json(companies);
  });

  app.post("/api/companies", (req, res) => {
    const { name, cnpj } = req.body;

    // Validação de Input
    if (!name || !cnpj || typeof name !== 'string' || typeof cnpj !== 'string') {
      return res.status(400).json({ error: "Nome e CNPJ são obrigatórios" });
    }

    if (name.length < 3 || cnpj.length < 14) {
      return res.status(400).json({ error: "Dados inválidos: Nome muito curto ou CNPJ incompleto" });
    }

    try {
      const result = db.prepare("INSERT INTO companies (name, cnpj) VALUES (?, ?)").run(name, cnpj);
      res.json({ id: result.lastInsertRowid, name, cnpj });
    } catch (e) {
      res.status(400).json({ error: "CNPJ já cadastrado" });
    }
  });

  app.get("/api/licenses", (req, res) => {
    const licenses = db.prepare(`
      SELECT l.*, c.name as company_name, c.cnpj as company_cnpj 
      FROM licenses l 
      JOIN companies c ON l.company_id = c.id
      ORDER BY l.expiry_date ASC
    `).all();
    res.json(licenses);
  });

  app.patch("/api/licenses/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { company_id, type, expiry_date, file_url, renewal_url } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    db.prepare(`
      UPDATE licenses 
      SET company_id = ?, type = ?, expiry_date = ?, file_url = ?, renewal_url = ? 
      WHERE id = ?
    `).run(company_id, type, expiry_date, file_url, renewal_url, id);
    res.json({ success: true });
  });

  app.delete("/api/licenses/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    db.prepare("DELETE FROM licenses WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/documents", (req, res) => {
    const docs = db.prepare(`
      SELECT d.*, l.type as license_type, c.name as company_name, c2.name as direct_company_name
      FROM documents d
      LEFT JOIN licenses l ON d.license_id = l.id
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN companies c2 ON d.company_id = c2.id
    `).all();
    res.json(docs);
  });

  app.post("/api/documents", (req, res) => {
    const { license_id, company_id, type, file_url } = req.body;

    // Validação de Input
    if (!type || !file_url) {
      return res.status(400).json({ error: "Tipo e URL são obrigatórios" });
    }

    const result = db.prepare("INSERT INTO documents (license_id, company_id, type, file_url) VALUES (?, ?, ?, ?)").run(
      license_id || null, 
      company_id || null, 
      type, 
      file_url
    );
    res.json({ id: result.lastInsertRowid, ...req.body });
  });

  app.delete("/api/documents/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    db.prepare("DELETE FROM documents WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.patch("/api/companies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { name, cnpj } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });
    
    db.prepare("UPDATE companies SET name = ?, cnpj = ? WHERE id = ?").run(name, cnpj, id);
    res.json({ success: true });
  });

  app.delete("/api/companies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    try {
      db.prepare("DELETE FROM companies WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Não é possível excluir empresa com licenças vinculadas" });
    }
  });

  app.get("/api/notifications", (req, res) => {
    // In a real app, we'd filter by the logged-in user's ID
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC").all();
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/notifications/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Email Configuration
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Twilio Configuration
  const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

  // Cron Job: Check for expiring licenses every Monday at 08:00
  cron.schedule("0 8 * * 1", async () => {
    console.log("Running weekly license renewal check...");
    
    const licenses = db.prepare(`
      SELECT l.*, c.name as company_name 
      FROM licenses l 
      JOIN companies c ON l.company_id = c.id
    `).all() as any[];

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const notificationEmail = process.env.NOTIFICATION_EMAIL || "armbarros2023@gmail.com";
    const notificationPhone = process.env.NOTIFICATION_PHONE_NUMBER || "17991693533";

    for (const license of licenses) {
      const expiryDate = new Date(license.expiry_date);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30 && diffDays > 0) {
        const title = `Renovação de Licença: ${license.type}`;
        const message = `A licença ${license.type} da empresa ${license.company_name} vence em ${diffDays} dias (${new Date(license.expiry_date).toLocaleDateString()}).`;
        
        // Create in-app notification for all admins
        const admins = db.prepare("SELECT id, email FROM users WHERE role = 'admin'").all() as any[];
        for (const admin of admins) {
          // Check if notification already exists to avoid duplicates (within the last week)
          const exists = db.prepare(`
            SELECT id FROM notifications 
            WHERE user_id = ? AND message = ? AND created_at > datetime('now', '-7 days')
          `).get(admin.id, message);
          
          if (!exists) {
            db.prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)").run(
              admin.id,
              title,
              message,
              "warning"
            );

            // Send Email
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
              try {
                await transporter.sendMail({
                  from: `"Sistema de Gestão de Licenças" <${process.env.SMTP_USER}>`,
                  to: notificationEmail,
                  subject: title,
                  text: message,
                  html: `<p>${message}</p><p><a href="${license.renewal_url}">Acesse o portal de renovação</a></p>`,
                });
                console.log(`Email sent to ${notificationEmail} for license ${license.id}`);
              } catch (error) {
                console.error(`Failed to send email to ${notificationEmail}:`, error);
              }
            }

            // Send SMS via Twilio
            if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
              try {
                await twilioClient.messages.create({
                  body: message,
                  from: process.env.TWILIO_FROM_NUMBER,
                  to: notificationPhone
                });
                console.log(`SMS sent to ${notificationPhone} for license ${license.id}`);
              } catch (error) {
                console.error(`Failed to send SMS to ${notificationPhone}:`, error);
              }
            }
          }
        }
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    runSecurityAudit();
    runSystemTests();
  });
}

startServer();
