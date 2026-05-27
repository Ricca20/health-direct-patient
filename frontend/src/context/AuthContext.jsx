// src/context/AuthContext.jsx (Patient)
import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, {
  setAuthContext,
  scheduleTokenRefresh,
  stopTokenRefresh,
} from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || null,
  );
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken") || null,
  );
  const [patient, setPatient] = useState(
    JSON.parse(localStorage.getItem("patient") || "null"),
  );
  const [profileCompleted, setProfileCompleted] = useState(
    patient?.profileCompleted || false,
  );
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // keep track of timer
  const refreshTimer = useRef(null);

  // === Refresh session using refreshToken ===
  const refreshSession = useCallback(async () => {
    try {
      const storedRefresh = localStorage.getItem("refreshToken");
      if (!storedRefresh) throw new Error("No refresh token available");

      const { data } = await api.post("/auth/refresh", {
        refreshToken: storedRefresh,
      });

      setToken(data.accessToken);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      setPatient(data.user);
      setProfileCompleted(data.user.profileCompleted || false);

      localStorage.setItem("hadPatientSession", "true");
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("patient", JSON.stringify(data.user));

      // clear + schedule silent refresh
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = scheduleTokenRefresh(data.accessToken);

      return true;
    } catch (err) {
      logout(false);
      return false;
    }
  }, []);

  // === Initial auth check on app load ===
  useEffect(() => {
    const init = async () => {
      if (localStorage.getItem("hadPatientSession") === "true") {
        const success = await refreshSession();
        if (!success) logout(false);
      }
      setIsLoading(false);
    };
    init();

    setAuthContext({ logout, login, updateToken });
  }, [refreshSession]);

  // === Login ===
  const login = (accessToken, refreshToken, patientData) => {
    setToken(accessToken);
    setRefreshToken(refreshToken);
    setPatient(patientData);
    setProfileCompleted(patientData.profileCompleted || false);

    localStorage.setItem("hadPatientSession", "true");
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("patient", JSON.stringify(patientData));

    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = scheduleTokenRefresh(accessToken);

    navigate("/dashboard");
  };

  // === Logout ===
  const logout = async (redirect = true) => {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
      }
    } catch (err) {
    } finally {
      setToken(null);
      setRefreshToken(null);
      setPatient(null);
      setProfileCompleted(false);

      localStorage.removeItem("hadPatientSession");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("patient");

      // stop silent refresh
      stopTokenRefresh();
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }

      if (redirect) navigate("/signin");
    }
  };

  // === Update token from interceptors ===
  const updateToken = (newAccess, newRefresh) => {
    setToken(newAccess);
    if (newRefresh) {
      setRefreshToken(newRefresh);
      localStorage.setItem("refreshToken", newRefresh);
    }
    localStorage.setItem("accessToken", newAccess);

    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = scheduleTokenRefresh(newAccess);
  };

  const syncPatientProfile = (profileData = {}) => {
    setPatient((prev) => {
      const next = { ...(prev || {}), ...profileData };
      localStorage.setItem("patient", JSON.stringify(next));
      return next;
    });
    setProfileCompleted(Boolean(profileData.profileCompleted));
  };

  // === Refresh profile ===
  const refreshPatient = async () => {
    try {
      const { data } = await api.get("/patients/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatient(data);
      setProfileCompleted(data.profileCompleted || false);
      localStorage.setItem("patient", JSON.stringify(data));
    } catch (err) {}
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        patient,
        profileCompleted,
        isLoading,
        login,
        logout,
        updateToken,
        syncPatientProfile,
        refreshPatient,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
