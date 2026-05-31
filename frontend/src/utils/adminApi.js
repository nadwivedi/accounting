import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== '/admlogin' && !path.startsWith('/login') && !path.startsWith('/adm')) {
        window.location.href = '/admlogin';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default adminApi;
