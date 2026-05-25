import { useEffect, useState } from "react";
import { suscribirPartidosFecha, obtenerFechas, obtenerUltimaFecha, hoyLocal } from "../firebase/matches";
import { CLUBS, CATEGORIAS } from "../data/clubs";
import ClubLogo from "../components/ClubLogo";

const getClub = (id) => CLUBS.find(c => c.id === id);

function PartidoCard({ partido }) {
  const esSanAlbanoLocal = partido.condicion === "local";
  const localId   = esSanAlbanoLocal ? "sanalbano" : partido.rival_id;
  const visitanteId = esSanAlbanoLocal ? partido.rival_id : "sanalbano";
  const localLetra   = esSanAlbanoLocal ? partido.equipo_letra : partido.rival_letra;
  const visitanteLetra = esSanAlbanoLocal ? partido.rival_letra : partido.equipo_letra;
  const puntosLocal   = esSanAlbanoLocal ? partido.puntos_san_albano : partido.puntos_rival;
  const puntosVisitante = esSanAlbanoLocal ? partido.puntos_rival : partido.puntos_san_albano;

  const localClub = getClub(localId);
  const visitanteClub = getClub(visitanteId);
  const finalizado = partido.estado === "finalizado";

  return (
    <div className={`partido-card ${finalizado ? "finalizado" : "en-curso"}`}>
      <div className="partido-equipos">
        <div className="equipo local-equipo">
          <ClubLogo clubId={localId} size={44} />
          <div className="equipo-info">
            <span className="club-nombre">{localClub?.nombre || localId}</span>
            <span className="equipo-letra">{localLetra}</span>
          </div>
        </div>

        <div className="marcador">
          <span className="pts">{puntosLocal}</span>
          <span className="vs">vs</span>
          <span className="pts">{puntosVisitante}</span>
        </div>

        <div className="equipo visitante-equipo">
          <div className="equipo-info text-right">
            <span className="club-nombre">{visitanteClub?.nombre || visitanteId}</span>
            <span className="equipo-letra">{visitanteLetra}</span>
          </div>
          <ClubLogo clubId={visitanteId} size={44} />
        </div>
      </div>

      <div className="partido-footer">
        {partido.tries_san_albano > 0 && (
          <span className="tries-badge">
            🏉 {partido.tries_san_albano} {partido.tries_san_albano === 1 ? "try" : "tries"} San Albano
          </span>
        )}
        <span className={`estado-badge ${finalizado ? "badge-final" : "badge-curso"}`}>
          {finalizado ? "✅ Finalizado" : "🟡 En curso"}
        </span>
      </div>
    </div>
  );
}

function CategoriaSection({ categoria, partidos }) {
  if (partidos.length === 0) return null;
  return (
    <div className="categoria-section">
      <h2 className="categoria-title">{categoria}</h2>
      <div className="partidos-list">
        {partidos.map(p => <PartidoCard key={p.id} partido={p} />)}
      </div>
    </div>
  );
}

export default function PublicPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [fechas, setFechas] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modoFecha, setModoFecha] = useState("auto"); // "auto" | "manual"

  // Cargar lista de fechas disponibles
  useEffect(() => {
    obtenerFechas().then(setFechas);
  }, []);

  // Determinar qué fecha mostrar al inicio
  useEffect(() => {
    const hoy = hoyLocal();
    const esDomingo = new Date().getDay() === 0;

    if (esDomingo) {
      setFechaSeleccionada(hoy);
    } else {
      obtenerUltimaFecha().then(f => {
        setFechaSeleccionada(f || hoy);
      });
    }
  }, []);

  // Suscripción en tiempo real a la fecha seleccionada
  useEffect(() => {
    if (!fechaSeleccionada) return;
    setLoading(true);
    const unsub = suscribirPartidosFecha(fechaSeleccionada, (data) => {
      setPartidos(data);
      setLoading(false);
    });
    return unsub;
  }, [fechaSeleccionada]);

  const handleFechaChange = (e) => {
    setFechaSeleccionada(e.target.value);
    setModoFecha("manual");
  };

  const formatFecha = (f) => {
    if (!f) return "";
    const [y, m, d] = f.split("-");
    return `${d}/${m}/${y}`;
  };

  // Agrupar por categoría en orden
  const porCategoria = CATEGORIAS.map(cat => ({
    categoria: cat,
    partidos: partidos
      .filter(p => p.categoria === cat)
      .sort((a, b) => a.equipo_letra.localeCompare(b.equipo_letra))
  }));

  const hayPartidos = partidos.length > 0;

  return (
    <div className="public-page">
      <header className="public-header">
        <div className="header-logo">
          <ClubLogo clubId="sanalbano" size={56} />
          <div className="header-text">
            <h1>San Albano</h1>
            <p>Juveniles — Resultados en vivo</p>
          </div>
        </div>

        <div className="fecha-selector">
          <label>Fecha</label>
          <select value={fechaSeleccionada || ""} onChange={handleFechaChange}>
            {fechas.map(f => (
              <option key={f} value={f}>{formatFecha(f)}</option>
            ))}
            {fechaSeleccionada && !fechas.includes(fechaSeleccionada) && (
              <option value={fechaSeleccionada}>{formatFecha(fechaSeleccionada)} (hoy)</option>
            )}
          </select>
        </div>
      </header>

      <main className="public-main">
        {loading ? (
          <div className="estado-vacio">
            <div className="spinner" />
            <p>Cargando resultados...</p>
          </div>
        ) : !hayPartidos ? (
          <div className="estado-vacio">
            <span className="vacio-icon">🏉</span>
            <p>No hay partidos registrados para esta fecha.</p>
            {modoFecha === "auto" && <p className="vacio-sub">Los resultados aparecerán aquí en tiempo real.</p>}
          </div>
        ) : (
          porCategoria.map(({ categoria, partidos }) => (
            <CategoriaSection key={categoria} categoria={categoria} partidos={partidos} />
          ))
        )}
      </main>

      <footer className="public-footer">
        <a href="./admin" className="admin-link">Managers →</a>
      </footer>
    </div>
  );
}
