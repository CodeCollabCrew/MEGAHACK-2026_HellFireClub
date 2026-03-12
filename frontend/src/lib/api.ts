import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ⭐ USERID AUTO ATTACH INTERCEPTOR
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("userId");

      if (userId) {
        config.params = {
          ...(config.params || {}),
          userId: userId,
        };
      }
    }
  } catch (error) {
    console.warn("UserId attach error:", error);
  }

  return config;
});

// ⭐ RESPONSE ERROR LOGGER
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ---------------- TASKS ----------------
export const tasksApi = {
  getAll: () => api.get("/tasks"),

  getStats: () => api.get("/tasks/stats"),

  create: (data: object) => api.post("/tasks", data),

  update: (id: string, data: object) => api.put(`/tasks/${id}`, data),

  updateStage: (id: string, stage: string) =>
    api.patch(`/tasks/${id}/stage`, { stage }),

  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// ---------------- EMAILS ----------------
export const emailsApi = {
  getAll: () => api.get("/emails"),

  loadMock: () => api.post("/emails/mock"),

  processOne: (emailId: string) =>
    api.post(`/emails/${emailId}/process`),

  processAll: () => api.post("/emails/process-all"),
};

// ---------------- PIPELINE ----------------
export const pipelineApi = {
  get: () => api.get("/pipeline"),
};

// ---------------- INSIGHTS ----------------
export const insightsApi = {
  get: () => api.get("/insights"),
};

export default api;