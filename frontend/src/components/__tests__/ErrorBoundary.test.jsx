import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div data-testid="child">All good</div>
            </ErrorBoundary>,
        );

        expect(screen.getByTestId('child')).toBeTruthy();
        expect(screen.getByText('All good')).toBeTruthy();
    });

    it('renders error fallback UI when a child throws', () => {
        // Suppress console.error for the intentional error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const BuggyComponent = () => {
            throw new Error('Intentional test error');
        };

        render(
            <ErrorBoundary>
                <BuggyComponent />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Something went wrong')).toBeTruthy();
        expect(screen.getByText('An unexpected error occurred')).toBeTruthy();

        // Check that Go Home link exists
        const link = screen.getByText('Go Home');
        expect(link.tagName).toBe('A');
        expect(link.getAttribute('href')).toBe('/');

        consoleSpy.mockRestore();
    });
});
