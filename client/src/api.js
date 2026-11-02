import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'), timeout: 15000, withCredentials: true });
api.interceptors.response.use(response => response, error => { if (error.response?.status === 401) window.dispatchEvent(new Event('watchwise:session-expired')); return Promise.reject(error); });
export const errorMessage = error => error.response?.data?.message || 'Something went wrong. Please try again.';
