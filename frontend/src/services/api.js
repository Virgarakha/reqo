const BASE_URL = "https://rakarawr.com/backend/public/api";
0
export const api = {
  createProject: async (data) => {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getProject: async (id) => {
    const res = await fetch(`${BASE_URL}/projects/${id}`);
    return res.json();
  },

  saveSchema: async (id, payload) => {
    await fetch(`${BASE_URL}/projects/${id}/save`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  saveConversation: async (id, payload) => {
    await fetch(`${BASE_URL}/projects/${id}/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  saveVersion: async (id, snapshot) => {
    await fetch(`${BASE_URL}/projects/${id}/version`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot }),
    });
  },
};
