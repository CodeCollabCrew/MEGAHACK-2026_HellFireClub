import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// Tasks
export const tasksApi = {
  getAll: () => api.get("/tasks"),
  getStats: () => api.get("/tasks/stats"),
  create: (data: object) => api.post("/tasks", data),
  update: (id: string, data: object) => api.put(`/tasks/${id}`, data),
  updateStage: (id: string, stage: string) => api.patch(`/tasks/${id}/stage`, { stage }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Emails
export const emailsApi = {
  getAll: () => api.get("/emails"),
  loadMock: () => api.post("/emails/mock"),
  processOne: (emailId: string) => api.post(`/emails/${emailId}/process`),
  processAll: () => api.post("/emails/process-all"),
};

// Pipeline
export const pipelineApi = {
  get: () => api.get("/pipeline"),
};

// Insights
export const insightsApi = {
  get: () => api.get("/insights"),
};

export default api;
