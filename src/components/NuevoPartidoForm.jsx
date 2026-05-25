import { useState } from "react";
import { crearPartido, hoyLocal } from "../firebase/matches";
import { CLUBS, LETRAS, SAN_ALBANO_ID } from "../data/clubs";

const rivales = CLUBS.filter(c => c.id !== SAN_ALBANO_ID).sort((a, b) => a.nombre.localeCompare(b.nombre));

export default function NuevoPartidoForm({ categoria, onCreado }) {
  const [condicion, setCondicion] = useState("local");
  const [equipoLetra, setEquipoLetra] = useState("A");
  const [rivalId, setRivalId] = useState(rivales[0]?.id || "");
  const [rivalLetra, setRivalLetra] = useState("A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rivalId) { setError("Seleccioná un rival."); return; }
    setLoading(true);
    setError("");
    try {
      const ref = await crearPartido({
        categoria,
        fecha: hoyLocal(),
        condicion,
        equipo_letra: equipoLetra,
        rival_id: rivalId,
        rival_letra: rivalLetra,
      });
      if (onCreado) onCreado(ref.id);
    } catch (err) {
      setError("Error al crear el partido. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="nuevo-partido-form" onSubmit={handleSubmit}>
      <h3>Nuevo partido — {categoria}</h3>

      <div className="form-row">
        <label>Condición</label>
        <div className="radio-group">
          <label className={`radio-btn ${condicion === "local" ? "active" : ""}`}>
            <input type="radio" value="local" checked={condicion === "local"} onChange={() => setCondicion("local")} />
            🏠 Local
          </label>
          <label className={`radio-btn ${condicion === "visitante" ? "active" : ""}`}>
            <input type="radio" value="visitante" checked={condicion === "visitante"} onChange={() => setCondicion("visitante")} />
            ✈️ Visitante
          </label>
        </div>
      </div>

      <div className="form-equipos">
        <div className="form-equipo">
          <label>San Albano</label>
          <select value={equipoLetra} onChange={e => setEquipoLetra(e.target.value)}>
            {LETRAS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <span className="form-vs">vs</span>

        <div className="form-equipo">
          <label>Rival</label>
          <div className="rival-selects">
            <select value={rivalId} onChange={e => setRivalId(e.target.value)}>
              {rivales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <select value={rivalLetra} onChange={e => setRivalLetra(e.target.value)}>
              {LETRAS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="msg-error">{error}</p>}

      <button type="submit" className="btn-crear" disabled={loading}>
        {loading ? "Creando..." : "Iniciar partido →"}
      </button>
    </form>
  );
}
