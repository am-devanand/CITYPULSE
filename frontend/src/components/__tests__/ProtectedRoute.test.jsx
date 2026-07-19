import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock Navigate component to make assertions easier
const MockNavigate = vi.fn(({ to }) => <div data-testid="navigate" data-to={to} />);
vi.mock('react-router-dom', () => ({
    Navigate: (props) => <MockNavigate {...props} />,
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

import ProtectedRoute from '../ProtectedRoute';

describe('ProtectedRoute', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('redirects to "/" when user is null', () => {
        mockUseAuth.mockReturnValue({ user: null });

        render(
            <ProtectedRoute>
                <div data-testid="child">Protected Content</div>
            </ProtectedRoute>,
        );

        expect(screen.getByTestId('navigate')).toBeTruthy();
        expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/');
        expect(screen.queryByTestId('child')).toBeNull();
    });

    it('renders children when user is present', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'citizen', username: 'testuser' } });

        render(
            <ProtectedRoute>
                <div data-testid="child">Protected Content</div>
            </ProtectedRoute>,
        );

        expect(screen.getByTestId('child')).toBeTruthy();
        expect(screen.getByText('Protected Content')).toBeTruthy();
        expect(screen.queryByTestId('navigate')).toBeNull();
    });

    it('renders children for guest user', () => {
        mockUseAuth.mockReturnValue({
            user: { role: 'citizen', username: 'guest_123456', is_guest: true },
        });

        render(
            <ProtectedRoute>
                <div data-testid="child">Guest Content</div>
            </ProtectedRoute>,
        );

        expect(screen.getByTestId('child')).toBeTruthy();
        expect(screen.getByText('Guest Content')).toBeTruthy();
    });
});
