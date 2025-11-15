import axios from "axios";

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!baseUrl) {
  // eslint-disable-next-line no-console
  console.warn("EXPO_PUBLIC_BACKEND_URL is not set. API calls will fail.");
}

export const api = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic logging; you can expand this to surface UI errors
    // eslint-disable-next-line no-console
    console.log("API error", error?.response?.status, error?.message);
    return Promise.reject(error);
  }
);

export default api;
