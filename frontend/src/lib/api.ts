import axios from "axios";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ── Cookie helpers ────────────────────────────────────────────────────────────
export function saveToken(token: string) {
  localStorage.setItem("axon_token", token);
  // middleware cookie padhta hai — dono jagah save karo
  document.cookie = `axon_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearToken() {
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
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        clearToken();
        window.location.href = "/login";
      }
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
};

export default api;