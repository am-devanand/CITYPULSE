import { vi, describe, it, expect, beforeEach } from 'vitest';

// Use vi.hoisted to create the mock before vi.mock is hoisted
const { mockApi } = vi.hoisted(() => {
    const mockApi = {
        get: vi.fn(),
        post: vi.fn(),
    };
    return { mockApi };
});

vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockApi),
    },
}));

import {
    getCsrfToken,
    login,
    logout,
    getCurrentUser,
    getCollectors,
    getComplaints,
    createComplaint,
    assignComplaint,
    resolveComplaint,
    rejectComplaint,
    simulateTimeout,
    getDashboardStats,
} from '../index';

describe('API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Auth endpoints', () => {
        it('getCsrfToken calls api.get("/csrf/")', () => {
            getCsrfToken();
            expect(mockApi.get).toHaveBeenCalledWith('/csrf/');
        });

        it('login calls api.post("/login/") with username, password, role', () => {
            login('alice', 'secret', 'citizen');
            expect(mockApi.post).toHaveBeenCalledWith('/login/', {
                username: 'alice',
                password: 'secret',
                role: 'citizen',
            });
        });

        it('logout calls api.post("/logout/")', () => {
            logout();
            expect(mockApi.post).toHaveBeenCalledWith('/logout/');
        });

        it('getCurrentUser calls api.get("/users/me/")', () => {
            getCurrentUser();
            expect(mockApi.get).toHaveBeenCalledWith('/users/me/');
        });
    });

    describe('User endpoints', () => {
        it('getCollectors calls api.get("/users/collectors/")', () => {
            getCollectors();
            expect(mockApi.get).toHaveBeenCalledWith('/users/collectors/');
        });
    });

    describe('Complaint endpoints', () => {
        it('getComplaints calls api.get("/complaints/") with params', () => {
            const params = { status: 'PENDING' };
            getComplaints(params);
            expect(mockApi.get).toHaveBeenCalledWith('/complaints/', { params });
        });

        it('getComplaints defaults to empty params', () => {
            getComplaints();
            expect(mockApi.get).toHaveBeenCalledWith('/complaints/', { params: {} });
        });

        it('createComplaint posts multipart/form-data', () => {
            const formData = new FormData();
            formData.append('photo', new Blob(['test']), 'test.jpg');
            createComplaint(formData);
            expect(mockApi.post).toHaveBeenCalledWith('/complaints/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        });

        it('assignComplaint posts to /complaints/:id/assign/ with collector_id', () => {
            assignComplaint('CC-20250101-0001', 42);
            expect(mockApi.post).toHaveBeenCalledWith(
                '/complaints/CC-20250101-0001/assign/',
                { collector_id: 42 },
            );
        });

        it('resolveComplaint posts multipart/form-data', () => {
            const formData = new FormData();
            formData.append('after_photo', new Blob(['after']), 'after.jpg');
            resolveComplaint('CC-20250101-0002', formData);
            expect(mockApi.post).toHaveBeenCalledWith(
                '/complaints/CC-20250101-0002/resolve/',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } },
            );
        });

        it('rejectComplaint posts to /complaints/:id/reject/ with reason', () => {
            rejectComplaint('CC-20250101-0003', 'Not valid');
            expect(mockApi.post).toHaveBeenCalledWith(
                '/complaints/CC-20250101-0003/reject/',
                { reason: 'Not valid' },
            );
        });
    });

    describe('Simulation & Stats endpoints', () => {
        it('simulateTimeout posts to /simulate-timeout/ with complaint_ids', () => {
            simulateTimeout(['CC-001', 'CC-002']);
            expect(mockApi.post).toHaveBeenCalledWith('/simulate-timeout/', {
                complaint_ids: ['CC-001', 'CC-002'],
            });
        });

        it('simulateTimeout defaults to empty array', () => {
            simulateTimeout();
            expect(mockApi.post).toHaveBeenCalledWith('/simulate-timeout/', {
                complaint_ids: [],
            });
        });

        it('getDashboardStats calls api.get("/stats/")', () => {
            getDashboardStats();
            expect(mockApi.get).toHaveBeenCalledWith('/stats/');
        });
    });
});
