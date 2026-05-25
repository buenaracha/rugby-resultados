import { useState } from "react";
import { CLUBS } from "../data/clubs";

export default function ClubLogo({ clubId, size = 36, className = "" }) {
  const [error, setError] = useState(false);
  const club = CLUBS.find(c => c.id === clubId);
  if (!club) return null;

  const initials = club.nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  if (error || !club.logo) {
    return (
      <div
        className={`club-placeholder ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={club.logo}
      alt={club.nombre}
      width={size}
      height={size}
      className={`club-logo ${className}`}
      onError={() => setError(true)}
    />
  );
}
