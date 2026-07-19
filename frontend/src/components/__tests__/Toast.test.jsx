import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

// Mock framer-motion — ToastProvider uses motion.div + AnimatePresence for toast animations
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

import { ToastProvider, useToast } from '../Toast';

/** Helper component to trigger toasts via the context API inside a provider tree. */
const TestHarness = ({ message, type = 'info' }) => {
    const { toast } = useToast();
    return <button onClick={() => toast(message, type)}>Add Toast</button>;
};

describe('Toast', () => {
    it('renders children without crashing', () => {
        render(
            <ToastProvider>
                <div>child</div>
            </ToastProvider>,
        );
        expect(screen.getByText('child')).toBeTruthy();
    });

    it('renders toast message text', () => {
        render(
            <ToastProvider>
                <TestHarness message="Test notification" />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByText('Add Toast'));
        expect(screen.getByText('Test notification')).toBeTruthy();
    });

    it('renders with different variant types (success, error, info)', () => {
        render(
            <ToastProvider>
                <TestHarness message="Success toast" type="success" />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByText('Add Toast'));
        expect(screen.getByText('Success toast')).toBeTruthy();
        cleanup();

        render(
            <ToastProvider>
                <TestHarness message="Error toast" type="error" />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByText('Add Toast'));
        expect(screen.getByText('Error toast')).toBeTruthy();
        cleanup();

        render(
            <ToastProvider>
                <TestHarness message="Info toast" type="info" />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByText('Add Toast'));
        expect(screen.getByText('Info toast')).toBeTruthy();
    });

    it('removes toast when close button clicked', () => {
        render(
            <ToastProvider>
                <TestHarness message="Dismiss me" />
            </ToastProvider>,
        );
        fireEvent.click(screen.getByText('Add Toast'));
        expect(screen.getByText('Dismiss me')).toBeTruthy();

        // Click the close button on the toast
        fireEvent.click(screen.getByLabelText('Close notification'));
        expect(screen.queryByText('Dismiss me')).toBeNull();
    });
});
