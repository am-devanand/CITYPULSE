import { vi, describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

// Mock lucide-react so we can assert on which icon is rendered per status
vi.mock('lucide-react', () => ({
    Clock: (props) => <svg data-testid="icon-clock" {...props} />,
    UserCheck: (props) => <svg data-testid="icon-usercheck" {...props} />,
    CheckCircle2: (props) => <svg data-testid="icon-checkcircle" {...props} />,
    XCircle: (props) => <svg data-testid="icon-xcircle" {...props} />,
    AlertTriangle: (props) => <svg data-testid="icon-alerttriangle" {...props} />,
}));

import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
    it('renders without crashing', () => {
        render(<StatusBadge status="PENDING" />);
        expect(screen.getByText('PENDING')).toBeTruthy();
    });

    it('renders correct text for each status', () => {
        const statuses = ['PENDING', 'ASSIGNED', 'RESOLVED', 'REJECTED', 'ESCALATED'];
        for (const status of statuses) {
            render(<StatusBadge status={status} />);
            expect(screen.getByText(status)).toBeTruthy();
            cleanup();
        }
    });

    it('applies different size classes (sm, md, lg)', () => {
        render(<StatusBadge status="PENDING" size="sm" />);
        expect(screen.getByText('PENDING')).toBeTruthy();
        cleanup();

        render(<StatusBadge status="PENDING" size="md" />);
        expect(screen.getByText('PENDING')).toBeTruthy();
        cleanup();

        render(<StatusBadge status="PENDING" size="lg" />);
        expect(screen.getByText('PENDING')).toBeTruthy();
    });

    it('renders correct Lucide icon for each status', () => {
        const cases = [
            { status: 'PENDING', testId: 'icon-clock' },
            { status: 'ASSIGNED', testId: 'icon-usercheck' },
            { status: 'RESOLVED', testId: 'icon-checkcircle' },
            { status: 'REJECTED', testId: 'icon-xcircle' },
            { status: 'ESCALATED', testId: 'icon-alerttriangle' },
        ];
        for (const { status, testId } of cases) {
            render(<StatusBadge status={status} />);
            expect(screen.getByTestId(testId)).toBeTruthy();
            cleanup();
        }
    });
});
