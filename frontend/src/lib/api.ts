import axios from "axios";

const getBaseURL = () => {
  const url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
  // If the user provided a URL ending in /api, strip it because the endpoints below already include /api/
  return url.endsWith("/api") ? url.slice(0, -4) : url;
};

const BASE = getBaseURL();

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Dev bypass (development-only fallback when backend is unavailable) ─────────
const DEV_BYPASS_PREFIX = "dev-bypass-";

export function isDevBypassToken(token: string | null): boolean {
  return typeof token === "string" && token.startsWith(DEV_BYPASS_PREFIX);
}

/** In development, create a temporary session so the UI can be used without a running backend. */
export function createDevSession(email: string, name?: string): void {
  if (typeof window === "undefined") return;
  const devToken = `${DEV_BYPASS_PREFIX}${Date.now()}`;
  const user = {
    name: name || email.split("@")[0] || "Dev User",
    email,
    isGuest: false,
  };
  saveToken(devToken);
  localStorage.setItem("axon_user", JSON.stringify(user));
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
export function saveToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("axon_token", token);
  document.cookie = `axon_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("axon_token");
  localStorage.removeItem("axon_user");
  document.cookie = "axon_token=; path=/; max-age=0";
}

// ── Request interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("axon_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const token = localStorage.getItem("axon_token");
      if (isDevelopment() && isDevBypassToken(token)) {
        return Promise.reject(error);
      }
      clearToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { token, user } = res.data.data;
    saveToken(token);                                          // ✅ cookie + localStorage
    localStorage.setItem("axon_user", JSON.stringify(user));
    return res;
  },

  register: async (email: string, password: string, name: string) => {
    const res = await api.post("/api/auth/register", { email, password, name });
    const { token, user } = res.data.data;
    saveToken(token);
    localStorage.setItem("axon_user", JSON.stringify(user));
    return res;
  },

  guest: async () => {
    const res = await api.post("/api/auth/guest");
    const { token, user } = res.data.data;
    saveToken(token);
    localStorage.setItem("axon_user", JSON.stringify(user));
    return res;
  },

  me:        () => api.get("/api/auth/me"),
  googleUrl: (): string => `${BASE}/api/auth/google`,
};

// ── Tasks API ─────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll:      ()                          => api.get("/api/tasks"),
  getStats:    ()                          => api.get("/api/tasks/stats"),
  create:      (data: any)                 => api.post("/api/tasks", data),
  update:      (id: string, data: any)     => api.put(`/api/tasks/${id}`, data),
  updateStage: (id: string, stage: string) => api.put(`/api/pipeline/${id}/move`, { stage }),
  delete:      (id: string)                => api.delete(`/api/tasks/${id}`),
};

// ── Emails API ────────────────────────────────────────────────────────────────
export const emailsApi = {
  getAll:     ()                => api.get("/api/emails"),
  loadMock:   ()                => api.post("/api/emails/mock"),
  processOne: (emailId: string) => api.post(`/api/emails/${emailId}/process`),
  processAll: ()                => api.post("/api/emails/process-all"),
};

// ── Pipeline API ──────────────────────────────────────────────────────────────
export const pipelineApi = {
  get:        ()                      => api.get("/api/pipeline"),
  moveTask:   (id: string, data: any) => api.put(`/api/pipeline/${id}/move`, data),
  deleteTask: (id: string)            => api.delete(`/api/pipeline/${id}`),
};

// ── Insights API ──────────────────────────────────────────────────────────────
export const insightsApi = {
  get: () => api.get("/api/insights"),
};

// ── Excel API ─────────────────────────────────────────────────────────────────
export const excelApi = {
  getAttachments: () => api.get("/api/excel/attachments"),
  analyzeFile: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/api/excel/analyze", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  analyzeFromEmail: (emailId: string, attachmentId: string) =>
    api.post("/api/excel/analyze", { emailId, attachmentId }),
  getHistory: () => api.get("/api/excel/history"),
};

export default api;