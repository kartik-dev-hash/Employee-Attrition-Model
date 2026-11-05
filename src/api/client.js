import axios from "axios";

// Derive backend URL from environment variable (VITE_API_BASE_URL) when deployed,
// or fallback to current browser host on port 5000 for local development.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  `http://${window.location.hostname}:5000`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Bearer token dynamically to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle authentication errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - clear local session
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export default api;
