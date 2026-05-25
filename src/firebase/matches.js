import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, getDocs, limit, deleteDoc, getDoc
} from "firebase/firestore";
import { db } from "../firebase/config";

const matchesRef = collection(db, "matches");

// Fecha en formato YYYY-MM-DD local
export const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// Crear partido nuevo
export const crearPartido = (data) => {
  return addDoc(matchesRef, {
    ...data,
    puntos_san_albano: 0,
    puntos_rival: 0,
    tries_san_albano: 0,
    estado: "en_curso",
    scoring_log: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Suscripción a partidos de una fecha
export const suscribirPartidosFecha = (fecha, callback) => {
  const q = query(matchesRef, where("fecha", "==", fecha), orderBy("categoria"), orderBy("equipo_letra"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// Suscripción a partidos de una fecha y categoría
export const suscribirPartidosCategoria = (fecha, categoria, callback) => {
  const q = query(matchesRef, where("fecha", "==", fecha), where("categoria", "==", categoria), orderBy("equipo_letra"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// Obtener fecha del último partido jugado
export const obtenerUltimaFecha = async () => {
  const q = query(matchesRef, orderBy("fecha", "desc"), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data().fecha;
};

// Obtener todas las fechas distintas
export const obtenerFechas = async () => {
  const snap = await getDocs(query(matchesRef, orderBy("fecha", "desc")));
  const fechas = [...new Set(snap.docs.map(d => d.data().fecha))];
  return fechas;
};

// Agregar puntos con log
export const agregarPuntos = async (partidoId, equipo, puntos, esTry) => {
  const ref = doc(db, "matches", partidoId);
  // Leemos el documento actual
  const snap = await getDoc(ref);
  const data = snap.data();

  const log = data.scoring_log || [];
  const entrada = { equipo, puntos, esTry: !!esTry, ts: Date.now() };
  log.push(entrada);

  const updates = {
    scoring_log: log,
    updatedAt: serverTimestamp(),
  };

  if (equipo === "san_albano") {
    updates.puntos_san_albano = (data.puntos_san_albano || 0) + puntos;
    if (esTry) updates.tries_san_albano = (data.tries_san_albano || 0) + 1;
  } else {
    updates.puntos_rival = (data.puntos_rival || 0) + puntos;
  }

  return updateDoc(ref, updates);
};

// Deshacer última acción del log
export const deshacerUltimo = async (partidoId) => {
  const ref = doc(db, "matches", partidoId);
  const snap = await getDoc(ref);
  const data = snap.data();

  const log = [...(data.scoring_log || [])];
  if (log.length === 0) return;

  const ultima = log.pop();
  const updates = {
    scoring_log: log,
    updatedAt: serverTimestamp(),
  };

  if (ultima.equipo === "san_albano") {
    updates.puntos_san_albano = Math.max(0, (data.puntos_san_albano || 0) - ultima.puntos);
    if (ultima.esTry) updates.tries_san_albano = Math.max(0, (data.tries_san_albano || 0) - 1);
  } else {
    updates.puntos_rival = Math.max(0, (data.puntos_rival || 0) - ultima.puntos);
  }

  return updateDoc(ref, updates);
};

// Finalizar partido
export const finalizarPartido = (partidoId) => {
  return updateDoc(doc(db, "matches", partidoId), {
    estado: "finalizado",
    updatedAt: serverTimestamp(),
  });
};

// Actualizar partido (superadmin)
export const actualizarPartido = (partidoId, data) => {
  return updateDoc(doc(db, "matches", partidoId), { ...data, updatedAt: serverTimestamp() });
};

// Eliminar partido (superadmin)
export const eliminarPartido = (partidoId) => {
  return deleteDoc(doc(db, "matches", partidoId));
};
