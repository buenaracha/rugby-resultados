import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import AdminLogin from "./AdminLogin";
import NuevoPartidoForm from "../components/NuevoPartidoForm";
import PartidoPanel from "../components/PartidoPanel";
import SuperAdminPage from "./SuperAdminPage";
import { suscribirPartidosCategoria, hoyLocal } from "../firebase/matches";

export default function AdminPage() {
  const { user, loading, logout, getCategoria, isSuperAdmin } = useAuth();
  const [partidos, setPartidos] = useState([]);
  const [mostrarNuevo, setMostrarNuevo] = useState(true);

  const categoria = getCategoria();
  const esSuper = isSuperAdmin();

  useEffect(() => {
    if (!user || !categoria) return;
    const unsub = suscribirPartidosCategoria(hoyLocal(), categoria, (data) => {
      setPartidos(data.filter(p => p.estado === "en_curso"));
    });
    return unsub;
  }, [user, categoria]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (esSuper) {
    return <SuperAdminPage />;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-badge">{categoria}</span>
          <h1>Panel Manager</h1>
        </div>
        <div className="admin-header-right">
          <a href="./" target="_blank" rel="noreferrer" className="btn-ver-resultados">
            Ver resultados 🔗
          </a>
          <button className="btn-logout" onClick={logout}>Salir</button>
        </div>
      </header>

      <main className="admin-main">
        {/* Partidos en curso */}
        {partidos.length > 0 && (
          <section className="partidos-en-curso">
            <h2>En curso</h2>
            {partidos.map(p => (
              <PartidoPanel
                key={p.id}
                partido={p}
                onFinalizado={() => setMostrarNuevo(true)}
              />
            ))}
          </section>
        )}

        {/* Nuevo partido */}
        {mostrarNuevo && (
          <section className="nuevo-partido-section">
            <NuevoPartidoForm
              categoria={categoria}
              onCreado={() => setMostrarNuevo(false)}
            />
          </section>
        )}

        {!mostrarNuevo && partidos.length === 0 && (
          <div className="no-partidos">
            <p>¿Querés cargar otro partido?</p>
            <button className="btn-nuevo" onClick={() => setMostrarNuevo(true)}>+ Nuevo partido</button>
          </div>
        )}

        {partidos.length > 0 && !mostrarNuevo && (
          <button className="btn-nuevo-extra" onClick={() => setMostrarNuevo(true)}>+ Agregar otro partido</button>
        )}
      </main>
    </div>
  );
}
