// Central API service — all calls go through here.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Auth
export const authApi = {
  register: (name, email, password) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request("/api/auth/me"),
};

// Exams
export const examsApi = {
  list: () => request("/api/exams"),
  get: (id) => request(`/api/exams/${id}`),
};

// Universities
export const universitiesApi = {
  list: () => request("/api/universities"),
  get: (id) => request(`/api/universities/${id}`),
};

// Results
export const resultsApi = {
  submit: (payload) =>
    request("/api/results", { method: "POST", body: JSON.stringify(payload) }),
  mine: () => request("/api/results/me"),
  forExam: (examId) => request(`/api/results/exam/${examId}`),
  details: (resultId) => request(`/api/results/${resultId}/details`),
  deleteResult: (resultId) =>
    request(`/api/results/${resultId}`, { method: "DELETE" }),
  studentAnalytics: (studentId) => request(`/api/results/student/${studentId}`),
};
