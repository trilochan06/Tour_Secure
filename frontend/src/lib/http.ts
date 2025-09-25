import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:4000/api",
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
