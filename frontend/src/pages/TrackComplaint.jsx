import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, AlertCircle, Check } from 'lucide-react';
import { lookupComplaint } from '../api';

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    ASSIGNED: { label: 'Assigned', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    RESOLVED: { label: 'Resolved', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    REJECTED: { label: 'Rejected', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
    ESCALATED: { label: 'Escalated', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
};

const STEPS = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'resolved', label: 'Resolved' },
];

const STATUS_STEP_MAP = {
    PENDING: 0,
    ASSIGNED: 1,
    RESOLVED: 2,
    REJECTED: 0,
    ESCALATED: 0,
};

const TrackComplaint = () => {
    const { complaint_id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        setError(null);
        lookupComplaint(complaint_id)
            .then((res) => {
                setComplaint(res.data);
                setLoading(false);
            })
            .catch((err) => {
                if (err.response?.status === 404) {
                    setNotFound(true);
                } else {
                    setError(err.message || 'Failed to load complaint');
                }
                setLoading(false);
            });
    }, [complaint_id]);

    const slaInfo = complaint
        ? (() => {
              const created = new Date(complaint.created_at).getTime();
              const remaining = Math.max(
                  0,
                  16 * 60 * 60 * 1000 - (Date.now() - created)
              );
              const hours = Math.floor(remaining / 3600000);
              const minutes = Math.floor((remaining % 3600000) / 60000);
              let slaColor = 'text-green-400';
              if (hours < 2) slaColor = 'text-red-400';
              else if (hours < 6) slaColor = 'text-yellow-400';
              return { hours, minutes, slaColor };
          })()
        : null;

    const currentStep = complaint
        ? STATUS_STEP_MAP[complaint.status] ?? 0
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen mesh-gradient flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    <p className="text-white/60 text-sm">
                        Loading complaint details...
                    </p>
                </motion.div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Complaint Not Found
                    </h1>
                    <p className="text-white/50 mb-8">
                        No complaint found with ID{' '}
                        <span className="text-white/70 font-mono">
                            {complaint_id}
                        </span>
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition text-white"
                    >
                        Go Home
                    </button>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <AlertCircle className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Something went wrong
                    </h1>
                    <p className="text-white/50 mb-8">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition text-white"
                    >
                        Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    const statusConfig =
        STATUS_CONFIG[complaint.status] || STATUS_CONFIG.PENDING;

    return (
        <div className="min-h-screen mesh-gradient">
            {/* Header */}
            <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/')}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                        &larr; Back
                    </motion.button>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-lg font-bold gradient-text bg-gradient-to-r from-cyan-400 to-blue-500"
                    >
                        City Care
                    </motion.div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass rounded-2xl p-6 md:p-8"
                >
                    {/* Complaint ID + Status */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-white">
                            {complaint.complaint_id}
                        </h1>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}
                        >
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Status Timeline */}
                    <div className="mb-8">
                        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
                            Progress
                        </h2>
                        <div className="relative">
                            {/* Track */}
                            <div className="absolute top-4 left-0 right-0 h-1 bg-white/10 rounded-full" />
                            {/* Fill */}
                            <motion.div
                                initial={{ width: '0%' }}
                                animate={{
                                    width: `${
                                        STEPS.length > 1
                                            ? (currentStep /
                                                  (STEPS.length - 1)) *
                                              100
                                            : 0
                                    }%`,
                                }}
                                transition={{
                                    duration: 1,
                                    ease: 'easeOut',
                                }}
                                className="absolute top-4 left-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                            />
                            {/* Dots */}
                            <div className="relative flex justify-between">
                                {STEPS.map((step, index) => {
                                    const isActive = index <= currentStep;
                                    return (
                                        <div
                                            key={step.key}
                                            className="flex flex-col items-center"
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{
                                                    scale: isActive
                                                        ? 1
                                                        : 0.8,
                                                    backgroundColor: isActive
                                                        ? 'rgba(6, 182, 212, 1)'
                                                        : 'rgba(255,255,255,0.15)',
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                                style={{
                                                    color: isActive
                                                        ? '#fff'
                                                        : 'rgba(255,255,255,0.3)',
                                                }}
                                            >
                                                {isActive ? (
                                                    <Check className="w-4 h-4 text-white" />
                                                ) : (
                                                    index + 1
                                                )}
                                            </motion.div>
                                            <span
                                                className={`mt-2 text-xs ${
                                                    isActive
                                                        ? 'text-white/80'
                                                        : 'text-white/30'
                                                }`}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {complaint.status === 'REJECTED' && (
                            <p className="mt-3 text-xs text-red-400 text-center">
                                This complaint was rejected
                            </p>
                        )}
                        {complaint.status === 'ESCALATED' && (
                            <p className="mt-3 text-xs text-orange-400 text-center">
                                This complaint has been escalated for priority
                                handling
                            </p>
                        )}
                    </div>

                    {/* Photos */}
                    {(complaint.image_before || complaint.image_after) && (
                        <div className="mb-8">
                            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
                                Photos
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {complaint.image_before && (
                                    <div>
                                        <p className="text-xs text-white/40 mb-1">
                                            Before
                                        </p>
                                        <img
                                            src={complaint.image_before}
                                            alt="Before"
                                            className="w-full h-48 object-cover rounded-xl border border-white/10"
                                        />
                                    </div>
                                )}
                                {complaint.image_after && (
                                    <div>
                                        <p className="text-xs text-white/40 mb-1">
                                            After
                                        </p>
                                        <img
                                            src={complaint.image_after}
                                            alt="After"
                                            className="w-full h-48 object-cover rounded-xl border border-white/10"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Details */}
                    <div className="space-y-5">
                        {complaint.location_address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-white/40 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">
                                        Location
                                    </p>
                                    <p className="text-white/80">
                                        {complaint.location_address}
                                    </p>
                                </div>
                            </div>
                        )}

                        {slaInfo && (
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-white/40 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">
                                        SLA
                                    </p>
                                    <p
                                        className={`text-lg font-semibold ${slaInfo.slaColor}`}
                                    >
                                        {slaInfo.hours}h {slaInfo.minutes}m
                                        remaining
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-6 text-center"
                >
                    <button
                        onClick={() => navigate('/')}
                        className="glass-button px-8 py-3 rounded-xl text-white font-medium"
                    >
                        Report an Issue
                    </button>
                </motion.div>
            </main>
        </div>
    );
};

export default TrackComplaint;
