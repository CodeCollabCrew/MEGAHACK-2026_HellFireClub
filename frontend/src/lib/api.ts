import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("userId") || "guest@axon.ai";
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
  getAll:  ()                      => api.get("/api/tasks"),
  getStats: ()                     => api.get("/api/tasks/stats"),
  create:  (data: any)             => api.post("/api/tasks", data),
  update:  (id: string, data: any) => api.put(`/api/tasks/${id}`, data),
  delete:  (id: string)            => api.delete(`/api/tasks/${id}`),
};

export const emailsApi = {
  getAll:     ()                   => api.get("/api/emails"),
  loadMock:   ()                   => api.post("/api/emails/mock"),
  processOne: (emailId: string)    => api.post(`/api/emails/${emailId}/process`),
  processAll: ()                   => api.post("/api/emails/process-all"),
};

export const pipelineApi = {
  get:        ()                       => api.get("/api/pipeline"),
  moveTask:   (id: string, data: any)  => api.put(`/api/pipeline/${id}/move`, data),
  deleteTask: (id: string)             => api.delete(`/api/pipeline/${id}`),
};

export const insightsApi = {
  get: () => api.get("/api/insights"),
};

export default api;