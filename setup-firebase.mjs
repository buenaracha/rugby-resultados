#!/usr/bin/env node
/**
 * SCRIPT DE SETUP — San Albano Rugby
 * 
 * Crea los usuarios en Firebase Auth.
 * Ejecutar UNA SOLA VEZ después de clonar el repo.
 * 
 * Uso:
 *   node setup-firebase.mjs
 * 
 * Requiere: Firebase Admin SDK
 *   npm install firebase-admin --save-dev
 * 
 * Y un archivo serviceAccountKey.json descargado de:
 *   Firebase Console → Configuración ⚙️ → Cuentas de servicio → Generar nueva clave privada
 */

import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
const USUARIOS = [
  { email: "m15@sanalbano.rugby",         password: "M15sanalbano2025!" },
  { email: "m16@sanalbano.rugby",         password: "M16sanalbano2025!" },
  { email: "m17@sanalbano.rugby",         password: "M17sanalbano2025!" },
  { email: "m19@sanalbano.rugby",         password: "M19sanalbano2025!" },
  { email: "superadmin@sanalbano.rugby",  password: "SuperAdmin2025!" },
];
// ── FIN CONFIGURACIÓN ──────────────────────────────────────────────────────

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
} catch {
  console.error("❌ No se encontró serviceAccountKey.json");
  console.error("   Descargalo desde Firebase Console → Configuración → Cuentas de servicio");
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const adminAuth = getAuth();

console.log("🏉 Creando usuarios en Firebase Auth...\n");

for (const u of USUARIOS) {
  try {
    const user = await adminAuth.createUser({ email: u.email, password: u.password });
    console.log(`✅ Creado: ${u.email}  (uid: ${user.uid})`);
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      console.log(`⚠️  Ya existe: ${u.email} — omitido`);
    } else {
      console.error(`❌ Error con ${u.email}:`, err.message);
    }
  }
}

console.log("\n✅ Setup completo.");
console.log("⚠️  IMPORTANTE: Cambiá las contraseñas desde la app antes de usar en producción.");
