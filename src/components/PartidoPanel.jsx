import { useState } from "react";
import { agregarPuntos, deshacerUltimo, finalizarPartido } from "../firebase/matches";
import { CLUBS } from "../data/clubs";
import ClubLogo from "./ClubLogo";

const getClub = (id) => CLUBS.find(c => c.id === id);

export default function PartidoPanel({ partido, onFinalizado }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const esSanAlbanoLocal = partido.condicion === "local";
  const localId = esSanAlbanoLocal ? "sanalbano" : partido.rival_id;
  const visitanteId = esSanAlbanoLocal ? partido.rival_id : "sanalbano";
  const localLetra = esSanAlbanoLocal ? partido.equipo_letra : partido.rival_letra;
  const visitanteLetra = esSanAlbanoLocal ? partido.rival_letra : partido.equipo_letra;
  const puntosLocal = esSanAlbanoLocal ? partido.puntos_san_albano : partido.puntos_rival;
  const puntosVisitante = esSanAlbanoLocal ? partido.puntos_rival : partido.puntos_san_albano;
  const localClub = getClub(localId);
  const visitanteClub = getClub(visitanteId);

  const puntear = async (equipo, pts, esTry) => {
    setLoading(true);
    try { await agregarPuntos(partido.id, equipo, pts, esTry); }
    finally { setLoading(false); }
  };

  const deshacer = async () => {
    setLoading(true);
    try { await deshacerUltimo(partido.id); }
    finally { setLoading(false); }
  };

  const finalizar = async () => {
    setLoading(true);
    try {
      await finalizarPartido(partido.id);
      if (onFinalizado) onFinalizado();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  // Equipo San Albano en el marcador siempre referenciado correctamente
  const equipoSA = esSanAlbanoLocal ? "san_albano" : "rival";
  const equipoRival = esSanAlbanoLocal ? "rival" : "san_albano";

  const BotonesEquipo = ({ equipoKey, label }) => (
    <div className="botones-equipo">
      <span className="botones-label">{label}</span>
      <div className="botones-row">
        <button className="btn-pts btn-try" onClick={() => puntear(equipoKey, 5, equipoKey === "san_albano")} disabled={loading}>+5 🏉</button>
        <button className="btn-pts btn-conv" onClick={() => puntear(equipoKey, 2, false)} disabled={loading}>+2</button>
        <button className="btn-pts btn-pen" onClick={() => puntear(equipoKey, 3, false)} disabled={loading}>+3</button>
      </div>
    </div>
  );

  return (
    <div className="partido-panel">
      {/* Encabezado del partido */}
      <div className="panel-header">
        <div className="panel-equipo">
          <ClubLogo clubId={localId} size={36} />
          <span>{localClub?.nombre} <strong>{localLetra}</strong></span>
        </div>
        <div className="panel-marcador">
          <span>{puntosLocal}</span>
          <span className="panel-vs">vs</span>
          <span>{puntosVisitante}</span>
        </div>
        <div className="panel-equipo right">
          <span>{visitanteClub?.nombre} <strong>{visitanteLetra}</strong></span>
          <ClubLogo clubId={visitanteId} size={36} />
        </div>
      </div>

      {partido.tries_san_albano > 0 && (
        <div className="panel-tries">🏉 Tries San Albano: {partido.tries_san_albano}</div>
      )}

      {/* Botones de puntaje */}
      <div className="panel-botones">
        <BotonesEquipo equipoKey={esSanAlbanoLocal ? "san_albano" : "rival"} label={`${localClub?.nombre} ${localLetra}`} />
        <BotonesEquipo equipoKey={esSanAlbanoLocal ? "rival" : "san_albano"} label={`${visitanteClub?.nombre} ${visitanteLetra}`} />
      </div>

      {/* Deshacer y log */}
      <div className="panel-acciones">
        <button
          className="btn-deshacer"
          onClick={deshacer}
          disabled={loading || (partido.scoring_log || []).length === 0}
        >
          ↩ Deshacer último
        </button>
        {(partido.scoring_log || []).length > 0 && (
          <span className="log-ultimo">
            Último: {(() => {
              const u = partido.scoring_log[partido.scoring_log.length - 1];
              const quien = u.equipo === "san_albano" ? "San Albano" : (getClub(partido.rival_id)?.nombre || "Rival");
              return `+${u.puntos} ${quien}${u.esTry ? " (try)" : ""}`;
            })()}
          </span>
        )}
      </div>

      {/* Finalizar */}
      {!confirming ? (
        <button className="btn-finalizar" onClick={() => setConfirming(true)}>Finalizar partido</button>
      ) : (
        <div className="confirmar-box">
          <p>¿Confirmás que el partido terminó?</p>
          <div className="confirmar-btns">
            <button className="btn-confirmar-si" onClick={finalizar} disabled={loading}>✅ Sí, finalizar</button>
            <button className="btn-confirmar-no" onClick={() => setConfirming(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
