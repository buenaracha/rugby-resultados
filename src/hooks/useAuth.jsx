import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase/config";
import { MANAGER_EMAILS, SUPERMANAGER_EMAIL } from "../data/clubs";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const loginManager = (categoria, password) => {
    const email = MANAGER_EMAILS[categoria];
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginSuperAdmin = (password) => {
    return signInWithEmailAndPassword(auth, SUPERMANAGER_EMAIL, password);
  };

  const logout = () => signOut(auth);

  const changePassword = async (currentPassword, newPassword) => {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  // Determinar rol del usuario actual
  const getCategoria = () => {
    if (!user) return null;
    for (const [cat, email] of Object.entries(MANAGER_EMAILS)) {
      if (user.email === email) return cat;
    }
    return null;
  };

  const isSuperAdmin = () => user?.email === SUPERMANAGER_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, loginManager, loginSuperAdmin, logout, changePassword, getCategoria, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
