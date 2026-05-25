import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { CATEGORIAS } from "../data/clubs";

export default function AdminLogin({ onLogin }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modoCambio, setModoCambio] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [msgCambio, setMsgCambio] = useState("");

  const { loginManager, loginSuperAdmin, user, changePassword } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!categoriaSeleccionada && !modoCambio) return;
    setError("");
    setLoading(true);
    try {
      if (categoriaSeleccionada === "SUPER") {
        await loginSuperAdmin(password);
      } else {
        await loginManager(categoriaSeleccionada, password);
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError("Contraseña incorrecta. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCambioPassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) { setMsgCambio("Las contraseñas no coinciden."); return; }
    if (newPass.length < 6) { setMsgCambio("La contraseña debe tener al menos 6 caracteres."); return; }
    setMsgCambio("");
    setLoading(true);
    try {
      await changePassword(currentPass, newPass);
      setMsgCambio("✅ Contraseña cambiada con éxito.");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (err) {
      setMsgCambio("❌ Contraseña actual incorrecta.");
    } finally {
      setLoading(false);
    }
  };

  // Si ya está logueado y quiere cambiar contraseña
  if (user && modoCambio) {
    return (
      <div className="login-overlay">
        <div className="login-box">
          <h2>Cambiar contraseña</h2>
          <form onSubmit={handleCambioPassword} className="login-form">
            <input type="password" placeholder="Contraseña actual" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required />
            <input type="password" placeholder="Nueva contraseña" value={newPass} onChange={e => setNewPass(e.target.value)} required />
            <input type="password" placeholder="Repetir nueva contraseña" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required />
            {msgCambio && <p className={msgCambio.startsWith("✅") ? "msg-ok" : "msg-error"}>{msgCambio}</p>}
            <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Cambiar contraseña"}</button>
            <button type="button" className="btn-secundario" onClick={() => setModoCambio(false)}>Volver</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-overlay">
      <div className="login-box">
        <h2>🏉 Managers San Albano</h2>

        {!categoriaSeleccionada ? (
          <>
            <p className="login-instruccion">Seleccioná tu categoría</p>
            <div className="categoria-btns">
              {CATEGORIAS.map(cat => (
                <button key={cat} className="cat-btn" onClick={() => setCategoriaSeleccionada(cat)}>{cat}</button>
              ))}
            </div>
            <button className="btn-texto" onClick={() => setCategoriaSeleccionada("SUPER")}>Acceso Super Manager</button>
            <button className="btn-texto" onClick={() => setModoCambio(true)}>Cambiar contraseña</button>
          </>
        ) : (
          <form onSubmit={handleLogin} className="login-form">
            <p className="login-instruccion">
              {categoriaSeleccionada === "SUPER" ? "Super Manager" : `Manager ${categoriaSeleccionada}`}
            </p>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
            />
            {error && <p className="msg-error">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</button>
            <button type="button" className="btn-secundario" onClick={() => { setCategoriaSeleccionada(null); setPassword(""); setError(""); }}>
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
