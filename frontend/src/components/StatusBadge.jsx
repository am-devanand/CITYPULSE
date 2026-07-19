import { Clock, UserCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const config = {
    PENDING: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Clock },
    ASSIGNED: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: UserCheck },
    RESOLVED: { color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle2 },
    REJECTED: { color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle },
    ESCALATED: { color: 'bg-orange-600/20 text-orange-400 border-orange-500/30 animate-pulse', icon: AlertTriangle },
};

const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
};

const StatusBadge = ({ status, size = 'sm' }) => {
    const entry = config[status] || { color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: Clock };
    const Icon = entry.icon;

    return (
        <span className={`inline-flex items-center rounded border ${entry.color} ${sizeClasses[size] || sizeClasses.sm}`}>
            <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
            {status}
        </span>
    );
};

export default StatusBadge;
