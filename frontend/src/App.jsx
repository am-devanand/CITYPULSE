import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import LoadingScreen from './components/LoadingScreen';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const InspectorDashboard = lazy(() => import('./pages/InspectorDashboard'));
const CollectorDashboard = lazy(() => import('./pages/CollectorDashboard'));
const OfficerDashboard = lazy(() => import('./pages/OfficerDashboard'));
const TrackComplaint = lazy(() => import('./pages/TrackComplaint'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
    const location = useLocation();

    return (
        <ToastProvider>
        <AuthProvider>
            <div className="min-h-screen mesh-gradient text-white overflow-x-hidden">
                <AnimatePresence mode="wait">
                    <ErrorBoundary>
                        <Suspense fallback={<LoadingScreen />}>
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
                        </Suspense>
                    </ErrorBoundary>
                </AnimatePresence>
            </div>
        </AuthProvider>
        </ToastProvider>
    );
}

export default App;
