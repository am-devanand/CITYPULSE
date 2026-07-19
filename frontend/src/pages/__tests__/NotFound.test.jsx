import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

import NotFound from '../NotFound';

describe('NotFound page', () => {
    it('renders 404 heading', () => {
        render(<NotFound />);
        expect(screen.getByText('404')).toBeTruthy();
    });

    it('renders "Page not found" message', () => {
        render(<NotFound />);
        expect(screen.getByText('Page not found')).toBeTruthy();
    });

    it('renders descriptive text', () => {
        render(<NotFound />);
        expect(screen.getByText("The page you're looking for doesn't exist.")).toBeTruthy();
    });

    it('has a Go Home link pointing to "/"', () => {
        render(<NotFound />);
        const link = screen.getByText('Go Home');
        expect(link.tagName).toBe('A');
        expect(link.getAttribute('href')).toBe('/');
    });
});
