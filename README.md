# 🏉 San Albano — Resultados Juveniles

App web de resultados en tiempo real para las categorías juveniles de San Albano Rugby Club.

---

## Stack

- **React + Vite** — frontend
- **Firebase Firestore** — base de datos en tiempo real
- **Firebase Auth** — autenticación de managers
- **GitHub Pages** — hosting

---

## Estructura de usuarios

| Usuario | Email (interno) | Rol |
|---|---|---|
| Manager M15 | m15@sanalbano.rugby | Carga partidos M15 |
| Manager M16 | m16@sanalbano.rugby | Carga partidos M16 |
| Manager M17 | m17@sanalbano.rugby | Carga partidos M17 |
| Manager M19 | m19@sanalbano.rugby | Carga partidos M19 |
| Super Manager | superadmin@sanalbano.rugby | Administración general |

---

## Setup inicial (una sola vez)

### 1. Clonar el repo e instalar dependencias

```bash
git clone https://github.com/TU_USUARIO/rugby-resultados.git
cd rugby-resultados
npm install
```

### 2. Configurar Firebase

En Firebase Console:
1. Activar **Firestore Database** (modo producción)
2. Activar **Authentication** → método **Email/Contraseña**
3. En Firestore, ir a **Reglas** y pegar el contenido de `firestore.rules`
4. En **Configuración del proyecto → Dominios autorizados**, agregar tu dominio de GitHub Pages: `TU_USUARIO.github.io`

### 3. Crear los usuarios en Firebase Auth

```bash
# Instalar Firebase Admin (solo para el setup)
npm install firebase-admin --save-dev

# Descargar la clave de servicio:
# Firebase Console → Configuración ⚙️ → Cuentas de servicio → Generar nueva clave privada
# Guardar como serviceAccountKey.json en la raíz del proyecto (NO subir a git)

node setup-firebase.mjs
```

Las contraseñas iniciales están en el script. **Cambiarlas desde la app después del primer login.**

### 4. Configurar el nombre del repo en vite.config.js

Si tu repo no se llama `rugby-resultados`, editá esta línea en `vite.config.js`:

```js
base: '/TU_NOMBRE_DE_REPO/',
```

Y la misma ruta en `src/App.jsx`:

```js
<BrowserRouter basename="/TU_NOMBRE_DE_REPO">
```

### 5. Deploy a GitHub Pages

```bash
# Primera vez: configurar gh-pages
npm run deploy
```

Luego en GitHub → Settings → Pages → Source: `gh-pages` branch.

Para deploys futuros:
```bash
npm run deploy
```

---

## URLs

| Pantalla | URL |
|---|---|
| Resultados (pública) | `https://TU_USUARIO.github.io/rugby-resultados/` |
| Panel managers | `https://TU_USUARIO.github.io/rugby-resultados/admin` |

---

## Agregar un club nuevo

Editar `src/data/clubs.js` y agregar una entrada al array `CLUBS`:

```js
{ id: "nombreclub", nombre: "Nombre del Club", logo: BASE + "nombreclub.png" },
```

Luego hacer deploy: `npm run deploy`

## Modificar categorías o letras

En `src/data/clubs.js`:

```js
export const CATEGORIAS = ["M15", "M16", "M17", "M19"]; // agregar/quitar aquí
export const LETRAS = ["A", "B", "C", "D"];               // agregar/quitar aquí
```

---

## Desarrollo local

```bash
npm run dev
```

La app corre en `http://localhost:5173/rugby-resultados/`

---

## Archivos importantes

| Archivo | Descripción |
|---|---|
| `src/firebase/config.js` | Credenciales de Firebase |
| `src/data/clubs.js` | Lista de clubes, categorías, letras |
| `src/firebase/matches.js` | Lógica de Firestore |
| `setup-firebase.mjs` | Script de setup de usuarios |
| `firestore.rules` | Reglas de seguridad de Firestore |

---

## ⚠️ Seguridad

- No subir `serviceAccountKey.json` a git (ya está en `.gitignore`)
- Configurar los **dominios autorizados** en Firebase Auth
- Las contraseñas iniciales del script son provisorias — cambiarlas antes de usar
