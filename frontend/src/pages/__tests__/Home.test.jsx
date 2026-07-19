import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock framer-motion to render children directly
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

import Home from '../Home';

describe('Home page', () => {
    it('renders without crashing', () => {
        render(<Home />);
        expect(screen.getByText('City Care')).toBeTruthy();
    });

    it('renders the hero heading', () => {
        render(<Home />);
        expect(screen.getByText('Build a Cleaner')).toBeTruthy();
        expect(screen.getByText('Future Together')).toBeTruthy();
    });

    it('renders all four role cards', () => {
        render(<Home />);
        expect(screen.getByText('Citizen')).toBeTruthy();
        expect(screen.getByText('Sanitary Inspector')).toBeTruthy();
        expect(screen.getByText('Garbage Collector')).toBeTruthy();
        expect(screen.getByText('Municipal Officer')).toBeTruthy();
    });

    it('renders role descriptions', () => {
        render(<Home />);
        expect(screen.getByText('Report waste and track status')).toBeTruthy();
        expect(screen.getByText('Manage and assign complaints')).toBeTruthy();
        expect(screen.getByText('View and resolve tasks')).toBeTruthy();
        expect(screen.getByText('Monitor city-wide analytics')).toBeTruthy();
    });

    it('renders nav buttons', () => {
        render(<Home />);
        expect(screen.getByText('Home')).toBeTruthy();
        expect(screen.getByText('Waste Info')).toBeTruthy();
        expect(screen.getByText('Contact')).toBeTruthy();
    });

    it('renders footer with current year', () => {
        render(<Home />);
        const year = new Date().getFullYear();
        expect(screen.getByText(`© ${year} City Care Management System`)).toBeTruthy();
    });
});
