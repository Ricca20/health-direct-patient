// src/utils/api.js (Patient)
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const baseUrl = import.meta.env.VITE_BASE_URL;

let authContext = null;
export const setAuthContext = (ctx) => {
  authContext = ctx;
};

const api = axios.create({
  baseURL: `${baseUrl}/api`,
  withCredentials: true,
});

// === Refresh Handling State ===
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}
function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// === Request Interceptor ===
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === Response Interceptor ===
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for public/auth endpoints - these don't require authentication
    const publicEndpoints = [
      "/auth/login",
      "/login/signup",
      "/auth/verify-reset-token",
      "/auth/reset-password",
      "/auth/forgot-password",
      "/promos",
      "/doctors",
      "/specialties",
      "/notifications/common",  // Common notifications are public
      "/availability",  // Doctor availability is public
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      originalRequest?.url?.includes(endpoint)
    );

    if (isPublicEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Only attempt refresh if we have a refresh token
      const refreshTokenStored = localStorage.getItem("refreshToken");
      if (!refreshTokenStored) {
        // No refresh token = guest user, just reject the request
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${baseUrl}/api/auth/refresh`, { refreshToken: refreshTokenStored }, { withCredentials: true });

        const newToken = data.accessToken;
        const newRefresh = data.refreshToken;

        if (!newToken) throw new Error("Refresh failed: no access token in response");

        localStorage.setItem("accessToken", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        if (authContext?.updateToken) {
          authContext.updateToken(newToken, newRefresh);
        }

        onRefreshed(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        if (authContext?.logout) {
          authContext.logout(true);
        } else {
          localStorage.clear();
          window.location.href = "/signin";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// === Silent refresh timer management ===
let refreshTimer = null;

export function scheduleTokenRefresh(token) {
  try {
    const { exp } = jwtDecode(token);
    const expiresAt = exp * 1000;
    const now = Date.now();
    const refreshAt = expiresAt - 30 * 1000;

    const delay = refreshAt - now;

    if (refreshTimer) clearTimeout(refreshTimer);

    if (delay > 0) {
      refreshTimer = setTimeout(async () => {
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("No refresh token for silent refresh");

          const { data } = await api.post("/auth/refresh", { refreshToken });

          localStorage.setItem("accessToken", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }

          if (authContext?.updateToken) {
            authContext.updateToken(data.accessToken, data.refreshToken);
          }
        } catch (err) {
          authContext?.logout?.(true);
        }
      }, delay);

    }

    return refreshTimer;
  } catch (err) {
    return null;
  }
}

export function stopTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}



export const getEmailFromToken = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.email || null;
  } catch {
    return null;
  }
};

export const getPatientIdFromToken = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.patientId || null;
  } catch {
    return null;
  }
};

const DEVICE_ID_KEY = "health_direct_device_id";

const createDeviceId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const getCurrentDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = createDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const buildDeviceInfo = () => {
  const userAgent = navigator.userAgent || "Unknown";
  const platform = navigator.platform || "Unknown";
  const lowerUA = userAgent.toLowerCase();

  const browser = lowerUA.includes("edg/")
    ? "Microsoft Edge"
    : lowerUA.includes("opr/")
    ? "Opera"
    : lowerUA.includes("chrome/")
    ? "Chrome"
    : lowerUA.includes("firefox/")
    ? "Firefox"
    : lowerUA.includes("safari/")
    ? "Safari"
    : "Unknown";

  const os = lowerUA.includes("windows")
    ? "Windows"
    : lowerUA.includes("android")
    ? "Android"
    : lowerUA.includes("iphone") || lowerUA.includes("ipad")
    ? "iOS"
    : lowerUA.includes("mac")
    ? "macOS"
    : lowerUA.includes("linux")
    ? "Linux"
    : "Unknown";

  const deviceType = lowerUA.includes("mobile")
    ? "mobile"
    : lowerUA.includes("ipad") || lowerUA.includes("tablet")
    ? "tablet"
    : "desktop";

  const location = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

  return {
    deviceId: getCurrentDeviceId(),
    userAgent,
    platform,
    browser,
    os,
    deviceType,
    location,
  };
};

export const signup = (data) => api.post("/auth/signup", data);
export const signin = (data) =>
  api.post("/auth/login", { ...data, deviceInfo: buildDeviceInfo() });
export const sendOtp = (data) => api.post("/auth/send-otp", data);
export const verifyOtp = (data) =>
  api.post("/auth/verify-otp", { ...data, deviceInfo: buildDeviceInfo() });
export const signupOtp = (data) =>
  api.post("/auth/signup-otp", { ...data, deviceInfo: buildDeviceInfo() });

export const validateToken = () => api.get("/auth/validate");

export const logout = () => {
  const refreshToken = localStorage.getItem("refreshToken");
  return api.post(
    "/auth/logout",
    {},
    {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }
  );
};

export const getProfile = (patientId) =>
  api.get("/profile", {
    params: patientId ? { patientId } : {},
    headers: {},
  });

export const updateProfile = (data) =>
  api.put("/profile", data, {
    headers: {},
  });

export const getDoctors = () =>
  api.get("/doctors", {
    headers: {},
  });

export const getAvailability = async (
  doctorEmail,
  date,
  patientId = null
) => {
  try {
    const response = await api.get("/availability", {
      params: {
        doctorEmail,
        date,
        patientId,
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch availability",
      error: error.response?.data,
    };
  }
};

export const submitApplication = (formData, config = {}) => {
  const defaultHeaders = {
    "Content-Type": "multipart/form-data",
  };

  return api
    .post("/applications/submit", formData, {
      ...config,
      headers: {
        ...defaultHeaders,
        ...config.headers,
      },
      // Enable withCredentials if using cookies
      withCredentials: true,
      // Timeout after 2 minutes (120000ms)
      timeout: 120000,
      // Handle upload progress if provided in config
      onUploadProgress: (progressEvent) => {
        if (config.onUploadProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          config.onUploadProgress(percentCompleted);
        }
      },
    })
    .then((response) => {
      // Handle successful response
      if (response.status >= 200 && response.status < 300) {
        return {
          status: response.status,
          data: response.data,
          message:
            response.data?.message || "Application submitted successfully",
        };
      }
      // Handle unexpected successful status codes
      return Promise.reject({
        status: response.status,
        message: response.data?.message || "Unexpected response from server",
      });
    })
    .catch((error) => {
      // Enhanced error handling
      let errorDetails = {
        status: error.response?.status || 0,
        message: "Failed to submit application",
      };

      if (error.response) {
        // Server responded with error status
        errorDetails = {
          ...errorDetails,
          message:
            error.response.data?.error ||
            error.response.data?.message ||
            "Server responded with an error",
          data: error.response.data,
        };
      } else if (error.request) {
        // Request was made but no response received
        errorDetails = {
          ...errorDetails,
          message:
            "No response received from server. Please check your network connection.",
        };
      } else {
        // Something happened in setting up the request
        errorDetails = {
          ...errorDetails,
          message: error.message || "Error setting up request",
        };
      }

      // Handle specific error cases
      if (error.code === "ECONNABORTED") {
        errorDetails.message = "Request timeout. Please try again.";
      }

      if (error.response?.status === 413) {
        errorDetails.message =
          "File too large. Please reduce file size and try again.";
      }

      if (error.response?.status === 401) {
        errorDetails.message = "Session expired. Please log in again.";
        // Optionally trigger logout here
      }

      console.error("API Error:", errorDetails);
      return Promise.reject(errorDetails);
    });
};

export const createPayment = async (paymentData) => {
  try {
    const response = await api.post(`/payments/create`, paymentData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Recreate expired payment link
export const recreatePaymentLink = async (applicationId, type) => {
  if (!["consultation", "tests"].includes(type)) {
    throw new Error("Invalid payment type. Must be 'consultation' or 'tests'");
  }

  return api.post(`/payments/recreate/${encodeURIComponent(applicationId)}`, {
    type, // pass in body
  });
};

export const uploadPendingDocuments = (formData, config) =>
  api.post("/uploads/pending", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    ...(config || {}),
  });

export const getUserApplications = (patientId) =>
  api.get("/applications", {
    params: { patientId },
  });

export const getApplicationDetails = (id) =>
  api.get(`/applications/${encodeURIComponent(id)}`, {
    headers: {},
  });

export const joinMeetingByUser = (payload) =>
  api.post("/meetings/join-by-user", payload);

export const checkExistingAppointments = (specialty, patientId) => {
  return api.post(`/applications/existings`, { specialty, patientId });
};

export const downloadDocument = (fileId) => {
  return api.get(`/applications/media/${fileId}`, {
    responseType: "arraybuffer",
    headers: {},
  });
};

export const getPromos = async () => {
  try {
    return await api.get("/promos", {
      headers: {},
    });
  } catch (error) {
    // Guests can open dashboard without auth; treat 401 promos as empty state.
    if (error?.response?.status === 401) {
      return { data: { promos: [] } };
    }
    throw error;
  }
};

export const getCommonNotifications = () => {
  return api
    .get("/notifications/common", {
      headers: {},
    })
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      }
      return Promise.reject({
        status: response.status,
        message: response.data?.message || "Unexpected response from server",
      });
    })
    .catch((error) => {
      let errorDetails = {
        status: error.response?.status || 0,
        message: "Failed to fetch notifications",
      };

      if (error.response) {
        errorDetails = {
          ...errorDetails,
          message:
            error.response.data?.message || "Server responded with an error",
          data: error.response.data,
        };
      } else if (error.request) {
        errorDetails = {
          ...errorDetails,
          message:
            "No response received from server. Please check your network connection.",
        };
      } else {
        errorDetails = {
          ...errorDetails,
          message: error.message || "Error setting up request",
        };
      }

      return Promise.reject(errorDetails);
    });
};

export const getPersonalNotifications = (patientId) => {
  return api
    .get(`/notifications/personal?patientId=${encodeURIComponent(patientId)}`, {
      headers: {},
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });
};

export const markNotificationAsRead = (notificationId, role) => {
  return api.patch(
    `/notifications/${notificationId}/read`,
    { role },
    {
      headers: {},
    }
  );
};

export const uploadProfilePicture = (file, patientId) => {
  const formData = new FormData();
  formData.append("profilePicture", file);
  formData.append("patientId", patientId);
  return api.post("/profile/upload-profile-picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getProfilePicture = (fileId) => {
  return api.get(`/profile/image/${fileId}`, {
    responseType: "arraybuffer",
    headers: {},
  });
};

// Cancel appointment function
export const cancelAppointment = async (applicationId) => {
  try {
    const response = await api.patch(
      `/applications/${encodeURIComponent(applicationId)}/cancel`,
      {}
    );
    return {
      success: true,
      data: response.data,
      message: "Appointment cancelled successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to cancel appointment",
      error: error.response?.data,
    };
  }
};

export const checkTimeSlotConflict = async (
  patientEmail,
  appointmentDate,
  startTime
) => {
  try {
    const response = await api.post("/applications/check-time-conflict", {
      patientEmail,
      appointmentDate,
      startTime,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to check time slot conflict",
      error: error.response?.data,
    };
  }
};

export const bookFollowUp = async (applicationId, followUpData) => {
  try {
    const payload = {
      ...followUpData,
      paymentPreference: followUpData.paymentPreference || "pay_at_clinic",
    };

    const response = await api.put(
      `/applications/${encodeURIComponent(applicationId)}/follow-up-book`,
      payload
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Fetch payments for a patient
export const getUserPayments = async (patientId) => {
  return api.get(`/applications/patient/${encodeURIComponent(patientId)}`);
};

export const sendPasswordResetEmail = async (data) => {
  const response = await api.post(`/auth/forgot-password`, data);
  return response;
};

export const resetPassword = async (data) => {
  const response = await api.post(`/auth/reset-password`, data);
  return response;
};

export const verifyResetToken = async (token) => {
  const response = await api.get(`/auth/verify-reset-token/${token}`);
  return response;
};

export const getMyDevices = () => {
  const info = buildDeviceInfo();
  return api.get("/devices/my", {
    headers: {
      "x-device-id": info.deviceId,
      "x-device-user-agent": info.userAgent,
      "x-device-platform": info.platform,
      "x-device-browser": info.browser,
      "x-device-os": info.os,
      "x-device-type": info.deviceType,
      "x-device-location": info.location,
    },
  });
};

export const revokeDeviceSession = (sessionId) =>
  api.patch(`/devices/${encodeURIComponent(sessionId)}/revoke`);

export const revokeOtherDeviceSessions = (currentDeviceId) =>
  api.patch("/devices/revoke-others", { currentDeviceId });

export default api;
