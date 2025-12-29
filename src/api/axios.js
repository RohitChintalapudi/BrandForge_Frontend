import axios from "axios";

const api = axios.create({
  baseURL: "https://brandforge-backend.onrender.com",
  withCredentials: true,
});

export default api;
