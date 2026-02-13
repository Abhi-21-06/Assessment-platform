import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// --------------------
// Dashboard
// --------------------
export const getStudents = () => API.get("/api/students");
export const getTests = () => API.get("/api/tests");
export const getAttempts = (params) =>
  API.get("/api/attempts", { params });
export const getFlags = () => API.get("/api/flags");

// --------------------
// Leaderboard
// --------------------
export const getLeaderboard = (testId) =>
  API.get(`/api/leaderboard?test_id=${testId}`);

// --------------------
// Attempt Actions
// --------------------
export const recomputeAttempt = (id) =>
  API.post(`/api/attempts/${id}/recompute`);

export const flagAttempt = (id, reason) =>
  API.post(`/api/attempts/${id}/flag?reason=${reason}`);

export const getAttemptDetail = (id) =>
  API.get(`/api/attempts/${id}`);

