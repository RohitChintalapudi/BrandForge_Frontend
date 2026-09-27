import axios from "axios";

const api = axios.create({
  baseURL: "https://brandforge-backend.onrender.com",
  withCredentials: true,
  timeout: 12000,
});

export default api;

