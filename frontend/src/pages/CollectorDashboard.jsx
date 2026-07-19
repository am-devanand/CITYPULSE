import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { getComplaints, resolveComplaint, rejectComplaint, simulateTimeout } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import useFetch from '../hooks/useFetch';
import DashboardLayout from '../components/DashboardLayout';
import { AlertTriangle, Sparkles, MapPin, X, Check } from 'lucide-react';

const getMapsUrl = (coords) => {
    if (!coords || typeof coords !== 'string') return null;
    const trimmed = coords.trim();
    const [lat, lng] = trimmed.split(',').map(s => s.trim());
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
};

const MapLink = ({ coords }) => {
    const mapsUrl = getMapsUrl(coords);
    if (mapsUrl) {
        return (
            <a href={mapsUrl} target="_blank" rel="noreferrer"
               className="text-blue-400 text-sm hover:underline flex items-center gap-1 mt-1">
                <MapPin className="w-5 h-5 inline-block" /> Open in Maps
            </a>
        );
    }
    return (
        <span className="text-white/40 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-5 h-5 inline-block" /> Location unavailable
        </span>
    );
};

const CollectorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTask, setActiveTask] = useState(null); // ID of task being worked on

    const handle401 = (promise) => promise.catch(err => {
        if (err.response?.status === 401) navigate('/login/collector');
    });

    const [actionType, setActionType] = useState(null); // 'resolve' or 'reject'
    const [formData, setFormData] = useState({ image_after: null, reason: '' });

    const { data: tasks, loading, error: fetchError, execute } = useFetch(
        () => getComplaints({ assigned_to: user?.id, status: 'ASSIGNED' }).then(r => r.data),
        [user?.id]
    );

    useEffect(() => {
        if (fetchError?.response?.status === 401) {
            navigate('/login/collector');
        }
    }, [fetchError, navigate]);

    const handleResolve = async (e) => {
        e.preventDefault();
        if (!formData.image_after) return toast("Please upload proof image", "warning");

        const data = new FormData();
        data.append('image_after', formData.image_after);

        try {
            await resolveComplaint(activeTask, data);
            resetAction();
            handle401(execute());
        } catch (err) {
            toast("Failed to resolve task", "error");
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        if (!formData.reason) return toast("Please provide a reason", "warning");

        try {
            await rejectComplaint(activeTask, formData.reason);
            resetAction();
            handle401(execute());
        } catch (err) {
            toast("Failed to reject task", "error");
        }
    };

    const resetAction = () => {
        setActiveTask(null);
        setActionType(null);
        setFormData({ image_after: null, reason: '' });
    };

    const handleSimulateDelay = async () => {
        try {
            await simulateTimeout(tasks.map(t => t.id));
            toast("Simulation triggered! 16hr delay simulated. Check Officer Dashboard.", "info");
            handle401(execute());
        } catch (err) {
            toast("Simulation failed", "error");
        }
    };

    return (
        <DashboardLayout
            title="My Tasks"
            subtitle="Garbage Collector Dashboard"
            role="collector"
            actions={
                <button
                    onClick={handleSimulateDelay}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 text-red-100 rounded-lg text-sm transition"
                >
                    <AlertTriangle className="w-5 h-5 inline-block" /> Simulate Delay
                </button>
            }
        >
            <div className="max-w-5xl mx-auto">

                {loading ? (
                    <div className="text-white text-center py-20">Loading tasks...</div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {tasks.length === 0 && (
                                <div className="text-center py-20 text-white/50 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-4xl mb-4"><Sparkles className="w-5 h-5 inline-block" /></p>
                                    <p>Clean sheet! No tasks assigned.</p>
                                </div>
                            )}

                            {tasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <GlassCard className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        <div className="flex-1 flex gap-4">
                                            <img
                                                src={task.image_before}
                                                alt="Task"
                                                className="w-24 h-24 rounded-lg object-cover bg-black/20"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-orange-300 text-sm">{task.complaint_id}</span>
                                                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {task.urgency_level > 1 ? 'High Priority' : 'Normal'}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-white">{task.location_address || "No Address"}</h3>
                                                <MapLink coords={task.location_coords} />
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto flex flex-col items-end gap-2 min-w-[300px]">
                                            {activeTask === task.id ? (
                                                <div className="w-full bg-black/20 p-4 rounded-lg border border-white/10">
                                                    <div className="flex justify-between mb-4">
                                                        <span className="font-bold text-sm text-white">{actionType === 'resolve' ? 'Upload Proof' : 'Reject Task'}</span>
                                                        <button onClick={resetAction} className="text-xs text-white/50 hover:text-white">Cancel</button>
                                                    </div>

                                                    {actionType === 'resolve' ? (
                                                        <form onSubmit={handleResolve} className="space-y-3">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                aria-label="Upload proof image"
                                                                onChange={(e) => setFormData({ ...formData, image_after: e.target.files[0] })}
                                                                className="text-sm"
                                                                required
                                                            />
                                                            <button type="submit" className="w-full py-2 bg-green-600 rounded text-sm font-bold text-white hover:bg-green-500">
                                                                Mark as Cleaned
                                                            </button>
                                                        </form>
                                                    ) : (
                                                        <form onSubmit={handleReject} className="space-y-3">
                                                            <textarea
                                                                placeholder="Reason for rejection..."
                                                                value={formData.reason}
                                                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                                className="w-full h-20 text-sm bg-black/30"
                                                                required
                                                            ></textarea>
                                                            <button type="submit" className="w-full py-2 bg-red-600 rounded text-sm font-bold text-white hover:bg-red-500">
                                                                Confirm Rejection
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <button
                                                        onClick={() => { setActiveTask(task.id); setActionType('reject'); }}
                                                        className="flex-1 px-4 py-2 border border-red-400/50 text-red-200 rounded-lg hover:bg-red-500/20 transition whitespace-nowrap"
                                                    >
                                                        <X className="w-5 h-5 inline-block" /> Reject
                                                    </button>
                                                    <button
                                                        onClick={() => { setActiveTask(task.id); setActionType('resolve'); }}
                                                        className="flex-1 px-6 py-2 bg-green-600 rounded-lg text-white font-bold hover:bg-green-500 shadow-lg shadow-green-900/20 whitespace-nowrap"
                                                    >
                                                        <Check className="w-5 h-5 inline-block" /> Cleaned
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CollectorDashboard;
