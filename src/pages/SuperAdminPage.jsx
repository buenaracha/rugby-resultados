import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase/config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { CLUBS, CATEGORIAS, LETRAS, MANAGER_EMAILS, SUPERMANAGER_EMAIL } from "../data/clubs";
import { obtenerFechas, eliminarPartido, actualizarPartido } from "../firebase/matches";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase/config";
import ClubLogo from "../components/ClubLogo";

const TABS = ["Usuarios", "Partidos", "Configuración"];

export default function SuperAdminPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("Usuarios");
  const [msg, setMsg] = useState("");

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  return (
    <div className="admin-page super-admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-badge super">SUPER</span>
          <h1>Super Manager</h1>
        </div>
        <div className="admin-header-right">
          <a href="./" target="_blank" rel="noreferrer" className="btn-ver-resultados">Ver resultados 🔗</a>
          <button className="btn-logout" onClick={logout}>Salir</button>
        </div>
      </header>

      <nav className="super-tabs">
        {TABS.map(t => (
          <button key={t} className={`super-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      {msg && <div className="super-msg">{msg}</div>}

      <main className="admin-main">
        {tab === "Usuarios" && <TabUsuarios showMsg={showMsg} />}
        {tab === "Partidos" && <TabPartidos showMsg={showMsg} />}
        {tab === "Configuración" && <TabConfig showMsg={showMsg} />}
      </main>
    </div>
  );
}

// ── Tab Usuarios ─────────────────────────────────────────────────────────────
function TabUsuarios({ showMsg }) {
  const allUsers = [
    ...Object.entries(MANAGER_EMAILS).map(([cat, email]) => ({ label: `Manager ${cat}`, email, cat })),
    { label: "Super Manager", email: SUPERMANAGER_EMAIL, cat: "SUPER" }
  ];
  const [selected, setSelected] = useState(null);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCambio = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) { showMsg("❌ Las contraseñas no coinciden."); return; }
    if (newPass.length < 6) { showMsg("❌ Mínimo 6 caracteres."); return; }
    setLoading(true);
    try {
      // Re-autenticar al superadmin con su propia contraseña
      const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
      await reauthenticateWithCredential(auth.currentUser, cred);

      // Para cambiar contraseña de otro usuario necesitaríamos Firebase Admin SDK (backend).
      // En el cliente solo podemos cambiar la del usuario actual.
      // Si el seleccionado es el superadmin actual, lo cambiamos directamente.
      if (selected.email === auth.currentUser.email) {
        await updatePassword(auth.currentUser, newPass);
        showMsg("✅ Contraseña del Super Manager actualizada.");
      } else {
        showMsg("ℹ️ Para cambiar contraseña de managers, usá la opción 'Cambiar contraseña' en su propio login. (Limitación del cliente Firebase)");
      }
      setCurrentPass(""); setNewPass(""); setConfirmPass(""); setSelected(null);
    } catch (err) {
      showMsg("❌ Contraseña actual incorrecta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-section">
      <h2>Usuarios</h2>
      <p className="super-info">Cada manager puede cambiar su contraseña desde la pantalla de login. Acá podés cambiar la del Super Manager.</p>
      <div className="users-list">
        {allUsers.map(u => (
          <div key={u.email} className={`user-row ${selected?.email === u.email ? "selected" : ""}`} onClick={() => setSelected(u)}>
            <span className="user-label">{u.label}</span>
            <span className="user-email">{u.email}</span>
          </div>
        ))}
      </div>
      {selected && (
        <form className="change-pass-form" onSubmit={handleCambio}>
          <h3>Cambiar contraseña — {selected.label}</h3>
          <input type="password" placeholder="Tu contraseña actual (Super Manager)" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required />
          <input type="password" placeholder="Nueva contraseña" value={newPass} onChange={e => setNewPass(e.target.value)} required />
          <input type="password" placeholder="Repetir nueva contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
          <div className="form-btns">
            <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Cambiar"}</button>
            <button type="button" className="btn-secundario" onClick={() => setSelected(null)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Tab Partidos ──────────────────────────────────────────────────────────────
function TabPartidos({ showMsg }) {
  const [fechas, setFechas] = useState([]);
  const [fechaSel, setFechaSel] = useState("");
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    obtenerFechas().then(fs => { setFechas(fs); if (fs[0]) setFechaSel(fs[0]); });
  }, []);

  useEffect(() => {
    if (!fechaSel) return;
    setLoading(true);
    import("firebase/firestore").then(({ getDocs, query, collection, where }) => {
      getDocs(query(collection(db, "matches"), where("fecha", "==", fechaSel))).then(snap => {
        setPartidos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    });
  }, [fechaSel]);

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este partido?")) return;
    await eliminarPartido(id);
    setPartidos(p => p.filter(x => x.id !== id));
    showMsg("✅ Partido eliminado.");
  };

  const handleToggleEstado = async (partido) => {
    const nuevoEstado = partido.estado === "finalizado" ? "en_curso" : "finalizado";
    await actualizarPartido(partido.id, { estado: nuevoEstado });
    setPartidos(p => p.map(x => x.id === partido.id ? { ...x, estado: nuevoEstado } : x));
    showMsg(`✅ Estado actualizado a "${nuevoEstado}".`);
  };

  const formatFecha = (f) => { const [y,m,d] = f.split("-"); return `${d}/${m}/${y}`; };

  return (
    <div className="super-section">
      <h2>Historial de partidos</h2>
      <div className="form-row">
        <label>Fecha</label>
        <select value={fechaSel} onChange={e => setFechaSel(e.target.value)}>
          {fechas.map(f => <option key={f} value={f}>{formatFecha(f)}</option>)}
        </select>
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="partidos-admin-list">
          {partidos.length === 0 && <p>No hay partidos para esta fecha.</p>}
          {partidos.map(p => {
            const localClub = CLUBS.find(c => c.id === (p.condicion === "local" ? "sanalbano" : p.rival_id));
            const visitanteClub = CLUBS.find(c => c.id === (p.condicion === "local" ? p.rival_id : "sanalbano"));
            const pL = p.condicion === "local" ? p.puntos_san_albano : p.puntos_rival;
            const pV = p.condicion === "local" ? p.puntos_rival : p.puntos_san_albano;
            return (
              <div key={p.id} className="partido-admin-row">
                <div className="partido-admin-info">
                  <span className="admin-cat">{p.categoria}</span>
                  <span>{localClub?.nombre} {p.condicion === "local" ? p.equipo_letra : p.rival_letra} {pL} — {pV} {visitanteClub?.nombre} {p.condicion === "local" ? p.rival_letra : p.equipo_letra}</span>
                  <span className={`estado-mini ${p.estado}`}>{p.estado === "finalizado" ? "✅" : "🟡"}</span>
                </div>
                <div className="partido-admin-btns">
                  <button className="btn-sm" onClick={() => handleToggleEstado(p)}>
                    {p.estado === "finalizado" ? "Reabrir" : "Finalizar"}
                  </button>
                  <button className="btn-sm btn-danger" onClick={() => handleEliminar(p.id)}>Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab Config ────────────────────────────────────────────────────────────────
function TabConfig({ showMsg }) {
  return (
    <div className="super-section">
      <h2>Configuración</h2>
      <div className="config-info">
        <h3>Categorías activas</h3>
        <div className="config-tags">
          {CATEGORIAS.map(c => <span key={c} className="config-tag">{c}</span>)}
        </div>
        <p className="super-info">Para agregar o quitar categorías, o modificar las letras de equipo disponibles, editá el archivo <code>src/data/clubs.js</code> en el repositorio.</p>

        <h3>Clubes cargados</h3>
        <p className="super-info">{CLUBS.length} clubes en la base de datos local.</p>
        <div className="clubs-mini-list">
          {CLUBS.map(c => (
            <div key={c.id} className="club-mini-row">
              <ClubLogo clubId={c.id} size={24} />
              <span>{c.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
