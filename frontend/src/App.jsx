import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import api from './api';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import NotFound from './pages/NotFound';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CitizenDashboard from './pages/CitizenDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import CollectorDashboard from './pages/CollectorDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import TrackComplaint from './pages/TrackComplaint';

function App() {
    const location = useLocation();
    const [csrfReady, setCsrfReady] = useState(false);

    useEffect(() => {
        api.get('/csrf/').finally(() => setCsrfReady(true));
    }, []);

    if (!csrfReady) {
        return (
            <div className="min-h-screen mesh-gradient flex items-center justify-center text-white">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    return (
        <ToastProvider>
        <AuthProvider>
            <div className="min-h-screen mesh-gradient text-white overflow-x-hidden">
                <AnimatePresence mode="wait">
                    <ErrorBoundary>
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<Home />} />
                            <Route path="/login/:role" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/citizen" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
                            <Route path="/inspector" element={<ProtectedRoute><InspectorDashboard /></ProtectedRoute>} />
                            <Route path="/collector" element={<ProtectedRoute><CollectorDashboard /></ProtectedRoute>} />
                            <Route path="/officer" element={<ProtectedRoute><OfficerDashboard /></ProtectedRoute>} />
                            <Route path="/track/:complaint_id" element={<TrackComplaint />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </ErrorBoundary>
                </AnimatePresence>
            </div>
        </AuthProvider>
        </ToastProvider>
    );
}

export default App;
