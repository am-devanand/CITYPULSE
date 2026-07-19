import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { getComplaints, getCollectors, assignComplaint } from '../api';
import { useToast } from '../components/Toast';
import usePoll from '../hooks/usePoll';
import DashboardLayout from '../components/DashboardLayout';
import { PartyPopper, Flame, AlertTriangle, Camera } from 'lucide-react';

const InspectorDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [complaints, setComplaints] = useState([]);
    const [collectors, setCollectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const fetchData = async () => {
        try {
            const [complaintsRes, collectorsRes] = await Promise.all([
                getComplaints({ status: 'PENDING,ESCALATED' }),
                getCollectors()
            ]);
            setComplaints(complaintsRes.data);
            setCollectors([...collectorsRes.data].sort((a, b) => a.username.localeCompare(b.username)));
            setLoading(false);
        } catch (err) {
            onError();
            if (err.response?.status === 401) navigate('/login/inspector');
        }
    };

    const handleAssign = async (complaintId, collectorId) => {
        try {
            await assignComplaint(complaintId, collectorId);
            setComplaints(prev => prev.filter(c => c.id !== complaintId));
            setSelectedComplaint(null);
        } catch (err) {
            toast("Failed to assign complaint", "error");
        }
    };

    const { onError } = usePoll(fetchData, { interval: 30000, maxInterval: 60000 });

    return (
        <DashboardLayout title="Inspector Dashboard" subtitle="Manage pending issues and assign tasks" role="inspector">
            <div className="max-w-6xl mx-auto">

                {loading ? (
                    <div className="text-white text-center py-20">Loading data...</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {complaints.length === 0 && (
                                <div className="col-span-full text-center py-20 text-white/50">
                                    <p className="text-4xl mb-4"><PartyPopper className="w-5 h-5 inline-block" /></p>
                                    <p>All clear! No pending complaints.</p>
                                </div>
                            )}

                            {complaints.map((complaint) => (
                                <motion.div
                                    key={complaint.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <GlassCard className={`h-full flex flex-col ${complaint.status === 'ESCALATED' ? 'border-red-500/50 bg-red-900/10' : ''}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-white/10 px-2 py-1 rounded text-xs text-white/70 font-mono">
                                                {complaint.complaint_id}
                                            </span>
                                            {complaint.urgency_level > 1 && (
                                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                                    <Flame className="w-5 h-5 inline-block" /> Urgency: {complaint.urgency_level}
                                                </span>
                                            )}
                                            {complaint.status === 'ESCALATED' && (
                                                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                                    <AlertTriangle className="w-5 h-5 inline-block" /> Escalated
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-grow">
                                            {complaint.image_before ? (
                                                <div className="h-40 mb-4 rounded-lg overflow-hidden relative group">
                                                    <img
                                                        src={complaint.image_before}
                                                        alt="Evidence"
                                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center justify-center transition">
                                                        <a href={complaint.image_before} target="_blank" aria-label="View full size image" className="text-white text-xs underline">View Full</a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-40 mb-4 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <Camera className="w-8 h-8 text-white/30" />
                                                </div>
                                            )}

                                            <p className="text-white font-medium mb-1 truncate">{complaint.location_address || "Unknown Location"}</p>
                                            <p className="text-xs text-white/50 mb-2 font-mono">{complaint.location_coords}</p>
                                            <p className="text-sm text-white/80">Reported by: <span className="text-emerald-300">{complaint.complainant_name || "Anonymous"}</span></p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            {selectedComplaint === complaint.id ? (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-white/50 mb-2">Select Collector:</p>
                                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                        {collectors.map(c => (
                                                            <button
                                                                key={c.id}
                                                                onClick={() => handleAssign(complaint.id, c.id)}
                                                                className="w-full text-left px-3 py-2 rounded bg-white/5 hover:bg-emerald-500/30 text-sm flex justify-between items-center transition"
                                                            >
                                                                <span className="text-white">{c.first_name || c.username}</span>
                                                                <span className="text-xs text-emerald-300">{(Math.random() * 4.5 + 0.5).toFixed(1)} km</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedComplaint(null)}
                                                        className="w-full text-center text-xs text-white/40 hover:text-white mt-2"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedComplaint(complaint.id)}
                                                    className="w-full py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition text-white text-sm font-semibold"
                                                >
                                                    Allocate Task
                                                </button>
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

export default InspectorDashboard;
