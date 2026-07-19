import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
});

export const getCsrfToken = () => api.get('/csrf/');

export const login = (username, password, role) =>
    api.post('/login/', { username, password, role });

export const logout = () =>
    api.post('/logout/');

export const getCurrentUser = () =>
    api.get('/users/me/');

export const getCollectors = () =>
    api.get('/users/collectors/');

export const getComplaints = (params = {}) =>
    api.get('/complaints/', { params });

export const createComplaint = (formData) =>
    api.post('/complaints/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

export const assignComplaint = (complaintId, collectorId) =>
    api.post(`/complaints/${complaintId}/assign/`, { collector_id: collectorId });

export const resolveComplaint = (complaintId, formData) =>
    api.post(`/complaints/${complaintId}/resolve/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

export const rejectComplaint = (complaintId, reason) =>
    api.post(`/complaints/${complaintId}/reject/`, { reason });

export const simulateTimeout = (complaintIds = []) =>
    api.post('/simulate-timeout/', { complaint_ids: complaintIds });

export const signup = (username, password, phone = '') =>
    api.post('/users/', { username, password, phone, role: 'CITIZEN' });

export const getDashboardStats = () =>
    api.get('/stats/');

export const lookupComplaint = (complaint_id) =>
    api.get(`/complaints/lookup/${complaint_id}/`);

export default api;
