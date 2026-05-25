import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import PublicPage from "./pages/PublicPage";
import AdminPage from "./pages/AdminPage";
import "./styles.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/rugby-resultados">
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
