import api from "./api";

export const chatService = {
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post("/chat/message", { message, sessionId });
    return response.data;
  },

  getHistory: async (sessionId = null) => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.get("/chat/history", { params });
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chat/sessions/${sessionId}`);
    return response.data;
  },

  createSession: async (title = "New Conversation") => {
    const response = await api.post("/chat/sessions", { title });
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get("/chat/sessions");
    return response.data;
  },

  getSessionMessages: async (sessionId) => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },
};

export const documentService = {
  upload: async (file, category = "other") => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("category", category);

    const response = await api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/documents");
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

export const goalService = {
  create: async (goalData) => {
    const response = await api.post("/goals", goalData);
    return response.data;
  },

  getAll: async (filters = {}) => {
    const response = await api.get("/goals", { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },

  addContribution: async (id, amount) => {
    const response = await api.post(`/goals/${id}/contribute`, { amount });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/goals/stats");
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get("/user/profile");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/user/profile", data);
    return response.data;
  },

  updateFinancialProfile: async (data) => {
    const response = await api.put("/user/financial-profile", data);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put("/user/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
