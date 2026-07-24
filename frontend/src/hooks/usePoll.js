import { useEffect, useRef, useCallback } from 'react';

const usePoll = (callback, { interval = 10000, maxInterval = 60000, maxErrors = null } = {}) => {
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

    const stop = useCallback(() => {
        isActive.current = false;
        clear();
    }, [clear]);

    const start = useCallback(() => {
        isActive.current = true;
        currentInterval.current = interval;
        errorCount.current = 0;
        clear();
        if (isActive.current) {
            intervalRef.current = setInterval(() => {
                savedCallback.current();
            }, currentInterval.current);
        }
    }, [interval, clear]);

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
        savedCallback.current();

        intervalRef.current = setInterval(() => {
            savedCallback.current();
        }, currentInterval.current);

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

    const onError = useCallback(() => {
        errorCount.current += 1;
        if (maxErrors !== null && errorCount.current >= maxErrors) {
            stop();
            return;
        }
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
    }, [maxInterval, clear, maxErrors, stop]);

    return { onError, resetInterval, stop, start };
};

export default usePoll;
