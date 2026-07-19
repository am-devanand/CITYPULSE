import GlassCard from './GlassCard';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <GlassCard className="flex items-center justify-between p-6 bg-gradient-to-br from-white/5 to-transparent">
        <div>
            <p className="text-white/60 text-sm uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full ${color} opacity-80 flex items-center justify-center`}>
            {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
    </GlassCard>
);

export default StatCard;
