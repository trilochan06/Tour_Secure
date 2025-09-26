import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:4000",
  withCredentials: true, // REQUIRED for cookies
});
