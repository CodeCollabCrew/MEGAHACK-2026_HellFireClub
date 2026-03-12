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
    const userId =
      localStorage.getItem("userId") || "guest@axon.ai";

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
  getAll: () => api.get("/tasks"),
  getStats: () => api.get("/tasks/stats"),
  create: (data: any) => api.post("/tasks", data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const emailsApi = {
  getAll: () => api.get("/emails"),
  loadMock: () => api.post("/emails/mock"),
};

export default api;