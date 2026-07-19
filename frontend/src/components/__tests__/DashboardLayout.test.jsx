import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock framer-motion — DashboardLayout uses motion.div for header animation
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
}));

// Mock react-router-dom hooks used by DashboardLayout
const mockNavigate = vi.fn();
const mockLocation = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation(),
}));

// Mock AuthContext — DashboardLayout calls useAuth() for logout
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock API — DashboardLayout imports logout from ../api
vi.mock('../../api', () => ({
    logout: vi.fn().mockResolvedValue({}),
}));

import DashboardLayout from '../DashboardLayout';

describe('DashboardLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            user: { role: 'citizen', username: 'testuser' },
            logout: vi.fn(),
        });
        mockLocation.mockReturnValue({ pathname: '/' });
    });

    it('renders without crashing', () => {
        render(
            <DashboardLayout title="Dashboard" role="citizen">
                <div>content</div>
            </DashboardLayout>,
        );
        expect(screen.getByText('City Care')).toBeTruthy();
    });

    it('renders children content', () => {
        render(
            <DashboardLayout title="Dashboard" role="citizen">
                <div data-testid="child-content">Hello World</div>
            </DashboardLayout>,
        );
        expect(screen.getByTestId('child-content')).toBeTruthy();
        expect(screen.getByText('Hello World')).toBeTruthy();
    });

    it('renders sidebar navigation', () => {
        render(
            <DashboardLayout title="Dashboard" role="citizen">
                <div>content</div>
            </DashboardLayout>,
        );
        // "Home" appears in both desktop sidebar and mobile tab bar
        const homeEls = screen.getAllByText('Home');
        expect(homeEls.length).toBe(2);
        // "My Complaints" also in both
        const mcEls = screen.getAllByText('My Complaints');
        expect(mcEls.length).toBe(2);
    });

    it('renders with different roles (citizen/officer)', () => {
        const { rerender } = render(
            <DashboardLayout title="Panel" role="citizen">
                <div>content</div>
            </DashboardLayout>,
        );
        const mcEls = screen.getAllByText('My Complaints');
        expect(mcEls.length).toBe(2);
        expect(screen.queryByText('Dashboard')).toBeNull();

        // Rerender as officer
        rerender(
            <DashboardLayout title="Panel" role="officer">
                <div>content</div>
            </DashboardLayout>,
        );
        const dashEls = screen.getAllByText('Dashboard');
        expect(dashEls.length).toBe(2);
        expect(screen.queryByText('My Complaints')).toBeNull();
    });

    it('renders logout button', () => {
        render(
            <DashboardLayout title="Dashboard" role="citizen">
                <div>content</div>
            </DashboardLayout>,
        );
        // Multiple buttons contain "Logout" text (sidebar, mobile tab, header)
        const buttons = screen.getAllByText('Logout');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders the provided title', () => {
        render(
            <DashboardLayout title="My Dashboard" role="citizen">
                <div>content</div>
            </DashboardLayout>,
        );
        expect(screen.getByText('My Dashboard')).toBeTruthy();
    });
});
