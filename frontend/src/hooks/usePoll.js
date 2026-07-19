import { useEffect, useRef, useCallback } from 'react';

const usePoll = (callback, { interval = 10000, maxInterval = 60000 } = {}) => {
    const savedCallback = useRef(callback);
    const intervalRef = useRef(null);
    const currentInterval = useRef(interval);
    const errorCount = useRef(0);
    const isActive = useRef(true);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const clear = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const resetInterval = useCallback(() => {
        currentInterval.current = interval;
        errorCount.current = 0;
        clear();
        if (isActive.current) {
            intervalRef.current = setInterval(() => {
                savedCallback.current();
            }, currentInterval.current);
        }
    }, [interval, clear]);

    useEffect(() => {
        // Initial call
        savedCallback.current();

        // Start polling
        intervalRef.current = setInterval(() => {
            savedCallback.current();
        }, currentInterval.current);

        // Handle tab visibility
        const handleVisibility = () => {
            if (document.hidden) {
                isActive.current = false;
                clear();
            } else {
                isActive.current = true;
                resetInterval();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clear();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [clear, resetInterval]);

    // Expose a way to handle errors and increase interval
    const onError = useCallback(() => {
        errorCount.current += 1;
        currentInterval.current = Math.min(
            currentInterval.current * 1.5,
            maxInterval
        );
        clear();
        if (isActive.current) {
            intervalRef.current = setInterval(() => {
                savedCallback.current();
            }, currentInterval.current);
        }
    }, [maxInterval, clear]);

    return { onError, resetInterval };
};

export default usePoll;
