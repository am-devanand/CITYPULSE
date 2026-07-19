import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ClipboardList, LayoutDashboard, LogOut } from 'lucide-react';
import { logout as apiLogout } from '../api';
import { useAuth } from '../context/AuthContext';

const navItems = {
    citizen: [
        { icon: Home, label: 'Home', path: '/' },
        { icon: ClipboardList, label: 'My Complaints', path: '/citizen' },
    ],
    inspector: [
        { icon: Home, label: 'Home', path: '/' },
        { icon: ClipboardList, label: 'Queue', path: '/inspector' },
    ],
    collector: [
        { icon: Home, label: 'Home', path: '/' },
        { icon: ClipboardList, label: 'My Tasks', path: '/collector' },
    ],
    officer: [
        { icon: Home, label: 'Home', path: '/' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/officer' },
    ],
};

const roleStyles = {
    citizen: {
        bg: 'bg-slate-900',
        headerBg: 'from-cyan-500 to-blue-600',
        accent: 'text-cyan-400',
        glow: ['bg-cyan-500/20', 'bg-blue-500/20'],
        sidebarAccent: 'bg-cyan-500',
        activeBg: 'bg-cyan-500/20',
        activeText: 'text-cyan-300',
    },
    inspector: {
        bg: 'bg-emerald-900',
        headerBg: 'from-emerald-500 to-teal-600',
        accent: 'text-emerald-300',
        glow: ['bg-emerald-500/10', 'bg-emerald-500/10'],
        sidebarAccent: 'bg-emerald-500',
        activeBg: 'bg-emerald-500/20',
        activeText: 'text-emerald-300',
    },
    collector: {
        bg: 'bg-amber-900',
        headerBg: 'from-amber-500 to-orange-600',
        accent: 'text-amber-300',
        glow: ['bg-orange-500/10', 'bg-orange-500/10'],
        sidebarAccent: 'bg-amber-500',
        activeBg: 'bg-amber-500/20',
        activeText: 'text-amber-300',
    },
    officer: {
        bg: 'bg-indigo-950',
        headerBg: 'from-purple-500 to-indigo-600',
        accent: 'text-indigo-200',
        glow: ['bg-indigo-500/10', 'bg-indigo-500/10'],
        sidebarAccent: 'bg-purple-500',
        activeBg: 'bg-purple-500/20',
        activeText: 'text-purple-300',
    },
};

const DashboardLayout = ({ title, subtitle, children, role, actions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout: authLogout } = useAuth();
    const style = roleStyles[role] || roleStyles.citizen;
    const items = navItems[role] || navItems.citizen;

    const handleLogout = async () => {
        await apiLogout();
        authLogout();
        navigate('/');
    };

    return (
        <div className={`min-h-screen ${style.bg} relative overflow-x-hidden`}>
            {/* Background glow orbs */}
            <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] ${style.glow[0]} rounded-full blur-[100px]`} />
            <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] ${style.glow[1]} rounded-full blur-[100px]`} />

            {/* Sidebar - desktop only */}
            <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 z-40 bg-gray-900 flex-col">
                {/* Role-colored top strip */}
                <div className={`h-1.5 bg-gradient-to-r ${style.headerBg}`} />

                {/* App name */}
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white tracking-tight">City Care</h2>
                </div>

                {/* Nav items */}
                <nav className="flex-1 p-4 space-y-1">
                    {items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                                    isActive
                                        ? `${style.activeBg} ${style.activeText} font-semibold`
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Logout at bottom */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile bottom tab bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-white/10 h-16 flex items-center justify-around px-2 pb-1 safe-area-pb">
                {items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition text-[10px] ${
                                isActive ? `${style.activeText} font-semibold` : 'text-white/50'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? '' : ''}`} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition text-[10px] text-white/50"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>

            {/* Main content area */}
            <div className="md:ml-64 min-h-screen pb-20 md:pb-0">
                {/* Sticky header */}
                <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-white/10">
                    <div className="flex items-center justify-between p-4 md:p-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
                            {subtitle && (
                                <p className={`text-sm ${style.accent}/60 mt-1`}>{subtitle}</p>
                            )}
                        </motion.div>
                        <div className="flex items-center gap-3">
                            {actions}
                            <button
                                onClick={handleLogout}
                                className="hidden md:inline-flex px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white text-sm transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
