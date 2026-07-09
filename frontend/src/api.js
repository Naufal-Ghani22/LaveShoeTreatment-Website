import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor to add Bearer token to requests if authenticated
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lavest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to redirect to login if token is expired/unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('lavest_token');
      localStorage.removeItem('lavest_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
