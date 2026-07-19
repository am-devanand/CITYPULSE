import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// StatCard uses GlassCard which renders a motion.div from framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
}));

import StatCard from '../StatCard';

describe('StatCard', () => {
    it('renders without crashing', () => {
        render(<StatCard title="Total Complaints" value="42" />);
        expect(screen.getByText('Total Complaints')).toBeTruthy();
        expect(screen.getByText('42')).toBeTruthy();
    });

    it('displays title and value', () => {
        render(<StatCard title="Pending" value="12" />);
        expect(screen.getByText('Pending')).toBeTruthy();
        expect(screen.getByText('12')).toBeTruthy();
    });

    it('renders with icon', () => {
        const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;
        render(
            <StatCard
                title="Resolved"
                value="99"
                icon={MockIcon}
                color="bg-green-500"
            />,
        );
        expect(screen.getByTestId('mock-icon')).toBeTruthy();
        expect(screen.getByText('Resolved')).toBeTruthy();
        expect(screen.getByText('99')).toBeTruthy();
    });

    it('renders without icon (backward compatible)', () => {
        render(<StatCard title="Open" value="5" />);
        expect(screen.getByText('Open')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
    });
});
