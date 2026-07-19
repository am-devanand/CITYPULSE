import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock framer-motion — TrackComplaint uses motion.div and motion.button
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        button: ({ children, ...props }) => <button {...props}>{children}</button>,
    },
}));

// Mock lucide-react icons used in success/details state
vi.mock('lucide-react', () => ({
    MapPin: (props) => <svg data-testid="icon-mappin" {...props} />,
    Clock: (props) => <svg data-testid="icon-clock" {...props} />,
    AlertCircle: (props) => <svg data-testid="icon-alertcircle" {...props} />,
    Check: (props) => <svg data-testid="icon-check" {...props} />,
}));

// Mock react-router-dom — TrackComplaint uses useParams + useNavigate
const mockUseParams = vi.fn();
vi.mock('react-router-dom', () => ({
    useParams: () => mockUseParams(),
    useNavigate: () => vi.fn(),
}));

// Mock API — TrackComplaint calls lookupComplaint
const mockLookupComplaint = vi.fn();
vi.mock('../../api', () => ({
    lookupComplaint: (...args) => mockLookupComplaint(...args),
}));

import TrackComplaint from '../TrackComplaint';

describe('TrackComplaint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParams.mockReturnValue({ complaint_id: 'CC-20250101-0001' });
    });

    it('renders without crashing when complaint loads successfully', async () => {
        mockLookupComplaint.mockResolvedValue({
            data: {
                complaint_id: 'CC-20250101-0001',
                status: 'PENDING',
                created_at: new Date().toISOString(),
            },
        });

        render(<TrackComplaint />);
        expect(await screen.findByText('CC-20250101-0001')).toBeTruthy();
    });

    it('shows not-found state when complaint returns 404', async () => {
        mockUseParams.mockReturnValue({ complaint_id: 'CC-INVALID' });
        mockLookupComplaint.mockRejectedValue({ response: { status: 404 } });

        render(<TrackComplaint />);
        expect(await screen.findByText('Complaint Not Found')).toBeTruthy();
    });

    it('renders loading state initially', () => {
        // A promise that never resolves keeps the component in loading state
        mockLookupComplaint.mockReturnValue(new Promise(() => {}));

        render(<TrackComplaint />);
        expect(screen.getByText('Loading complaint details...')).toBeTruthy();
    });
});
