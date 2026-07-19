import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { getComplaints, getDashboardStats } from '../api';
import usePoll from '../hooks/usePoll';
import DashboardLayout from '../components/DashboardLayout';
import { Truck, AlertCircle, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';

const OfficerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0, pending: 0, assigned: 0, resolved: 0, rejected: 0, escalated: 0, active: 0
    });
    const [complaints, setComplaints] = useState([]);
    const [filter, setFilter] = useState('ALL');

    const fetchData = async () => {
        try {
            const [statsRes, complaintsRes] = await Promise.all([
                getDashboardStats(),
                getComplaints()
            ]);
            setStats(statsRes.data);
            setComplaints(complaintsRes.data);
        } catch (err) {
            onError();
            if (err.response?.status === 401) navigate('/login/officer');
        }
    };

    const { onError } = usePoll(fetchData, { interval: 10000, maxInterval: 60000 });

    const filteredComplaints = filter === 'ALL'
        ? complaints
        : complaints.filter(c => c.status === filter);

    return (
        <DashboardLayout title="City Analytics" subtitle="Municipal Officer Overview" role="officer">
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard title="Active Issues" value={stats.active} icon={AlertCircle} color="bg-blue-500" />
                    <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle2} color="bg-green-500" />
                    <StatCard title="Escalated" value={stats.escalated} icon={AlertTriangle} color="bg-orange-500" />
                    <StatCard title="Total Reports" value={stats.total} icon={FileText} color="bg-purple-500" />
                </div>

                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Complaint Registry</h2>
                        <div className="flex gap-2 text-sm">
                            {['ALL', 'PENDING', 'ASSIGNED', 'ESCALATED', 'RESOLVED'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded-full transition ${filter === f ? 'bg-white text-indigo-900 font-bold' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-xs text-white/50 uppercase">
                                    <th className="p-4 font-normal">Complaint ID</th>
                                    <th className="p-4 font-normal">Location</th>
                                    <th className="p-4 font-normal">Status</th>
                                    <th className="p-4 font-normal">Urgency</th>
                                    <th className="p-4 font-normal">Collector</th>
                                    <th className="p-4 font-normal">Reported</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredComplaints.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-white/30">No records found</td>
                                    </tr>
                                ) : (
                                    filteredComplaints.map(row => (
                                        <tr key={row.id} className="hover:bg-white/5 transition border-t border-white/5">
                                            <td className="p-4 font-mono text-sm text-indigo-200">{row.complaint_id}</td>
                                            <td className="p-4 text-white/80 max-w-xs truncate" title={row.location_address}>{row.location_address || 'N/A'}</td>
                                            <td className="p-4">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="p-4 text-center">
                                                {row.urgency_level > 1 && <span className="text-red-400 font-bold">Lvl {row.urgency_level}</span>}
                                            </td>
                                            <td className="p-4 text-white/60 text-sm">
                                                {row.assigned_to_username ? (
                                                    <span className="flex items-center gap-1">
                                                        <Truck className="w-5 h-5 inline-block" /> {row.assigned_to_username}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-white/40 text-xs">
                                                {new Date(row.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </DashboardLayout>
    );
};

export default OfficerDashboard;
