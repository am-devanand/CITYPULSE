import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                // Verify session is still valid
                getCurrentUser()
                    .then(res => {
                        setUser(res.data);
                        localStorage.setItem('user', JSON.stringify(res.data));
                    })
                    .catch(() => {
                        // Session expired
                        setUser(null);
                        localStorage.removeItem('user');
                    })
                    .finally(() => setLoading(false));
            } catch {
                localStorage.removeItem('user');
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const loginUser = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
    }, []);

    return (
        <AuthContext.Provider value={{ user, loginUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
