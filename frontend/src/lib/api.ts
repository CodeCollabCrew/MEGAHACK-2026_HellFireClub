import axios from "axios";

const getBaseURL = () => {
  const url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
  // If the user provided a URL ending in /api, strip it because the endpoints below already include /api/
  return url.endsWith("/api") ? url.slice(0, -4) : url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get userId from localStorage
function getUserId(): string | null {
  if (typeof window === "undefined") return null;

  // First try direct "userId" key
  const directId = localStorage.getItem("userId");
  if (directId) return directId;

  // Fallback: parse from "axon_user" object
  const userStr = localStorage.getItem("axon_user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user._id || user.id || user.email || null;
    } catch {}
  }

  return null;
}

api.interceptors.request.use((config) => {
  const userId = getUserId();
  if (userId) {
    config.params = {
      ...(config.params || {}),
      userId,
    };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data);
    return Promise.reject(error);
  }
);

export const tasksApi = {
  getAll:      ()                      => api.get("/api/tasks"),
  getStats:    ()                      => api.get("/api/tasks/stats"),
  create:      (data: any)             => api.post("/api/tasks", data),
  update:      (id: string, data: any) => api.put(`/api/tasks/${id}`, data),
  updateStage: (id: string, stage: string) =>
    api.put(`/api/pipeline/${id}/move`, { stage }),
  delete:      (id: string)            => api.delete(`/api/tasks/${id}`),
};

export const emailsApi = {
  getAll:     ()                => api.get("/api/emails"),
  loadMock:   ()                => api.post("/api/emails/mock"),
  processOne: (emailId: string) => api.post(`/api/emails/${emailId}/process`),
  processAll: ()                => api.post("/api/emails/process-all"),
};

export const pipelineApi = {
  get:        ()                      => api.get("/api/pipeline"),
  moveTask:   (id: string, data: any) => api.put(`/api/pipeline/${id}/move`, data),
  deleteTask: (id: string)            => api.delete(`/api/pipeline/${id}`),
};

export const insightsApi = {
  get: () => api.get("/api/insights"),
};

export default api;