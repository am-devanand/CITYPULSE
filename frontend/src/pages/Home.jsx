import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import InfoDrawer from '../components/InfoDrawer';
import { Home as HomeIcon, Search, Truck, BarChart3 } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(null);
    const [trackId, setTrackId] = useState('');

    const roles = [
        {
            id: 'citizen',
            title: 'Citizen',
            icon: <HomeIcon className="w-5 h-5 inline-block" />,
            description: 'Report waste and track status',
            color: 'from-cyan-500 to-blue-500',
        },
        {
            id: 'inspector',
            title: 'Sanitary Inspector',
            icon: <Search className="w-5 h-5 inline-block" />,
            description: 'Manage and assign complaints',
            color: 'from-emerald-400 to-teal-600',
        },
        {
            id: 'collector',
            title: 'Garbage Collector',
            icon: <Truck className="w-5 h-5 inline-block" />,
            description: 'View and resolve tasks',
            color: 'from-orange-400 to-amber-500',
        },
        {
            id: 'officer',
            title: 'Municipal Officer',
            icon: <BarChart3 className="w-5 h-5 inline-block" />,
            description: 'Monitor city-wide analytics',
            color: 'from-purple-500 to-indigo-600',
        }
    ];

    const wasteInfoContent = {
        heading: 'Waste Segregation Guidelines',
        body: 'Proper waste segregation is essential for effective recycling and disposal. Follow these guidelines to help keep our city clean.',
        items: [
            'Green Bin: Wet Waste (food scraps, kitchen waste, garden waste)',
            'Blue Bin: Dry Waste (paper, plastic, metal, glass, cardboard)',
            'Do NOT mix wet and dry waste — contamination reduces recyclability',
            'Dispose of hazardous waste (batteries, electronics) at designated centers',
        ],
    };

    const contactContent = {
        heading: 'Contact Information',
        body: 'Reach out to City Care support for any queries or assistance.',
        items: [
            'Helpline: 1800-123-4567',
            'Email: help@citycare.com',
            'Office Hours: Monday — Friday, 9:00 AM — 6:00 PM',
            'Address: City Care Headquarters, Municipal Corporation Building',
        ],
    };

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-bold gradient-text bg-gradient-to-r from-cyan-400 to-blue-500"
                    >
                        City Care
                    </motion.div>
                    <div className="flex gap-6 text-sm font-medium text-white/80">
                        <span className="text-white cursor-default font-semibold">Home</span>
                        <button onClick={() => setDrawerOpen('waste')} className="hover:text-white transition-colors">Waste Info</button>
                        <button onClick={() => setDrawerOpen('contact')} className="hover:text-white transition-colors">Contact</button>
                    </div>
                </div>
            </nav>

            <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        <span className="block mb-2">Build a Cleaner</span>
                        <span className="gradient-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                            Future Together
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                        Smart waste management system for a sustainable city. Report issues, track pickups, and keep our streets clean with real-time updates.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    {roles.map((role, index) => (
                        <motion.div
                            key={role.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                        >
                            <GlassCard
                                hoverEffect={true}
                                onClick={() => navigate(`/login/${role.id}`)}
                                className="h-full flex flex-col items-center text-center group relative overflow-hidden"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 block">
                                    {role.icon}
                                </span>
                                <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-300 transition-colors">
                                    {role.title}
                                </h2>
                                <p className="text-white/60 group-hover:text-white/80 transition-colors">
                                    {role.description}
                                </p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="mt-16 w-full max-w-md mx-auto text-center"
                >
                    <h3 className="text-lg font-semibold text-white/80 mb-4">Track Your Complaint</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={trackId}
                            onChange={(e) => setTrackId(e.target.value)}
                            placeholder="Enter complaint ID (e.g., CC-20260716-1853)"
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
                            onKeyDown={(e) => e.key === 'Enter' && trackId && navigate(`/track/${trackId}`)}
                        />
                        <button
                            onClick={() => trackId && navigate(`/track/${trackId}`)}
                            disabled={!trackId}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:scale-[1.02] transition disabled:opacity-50 whitespace-nowrap"
                        >
                            Track
                        </button>
                    </div>
                </motion.div>
            </main>

            <footer className="text-center py-8 text-white/40 text-sm">
                &copy; {new Date().getFullYear()} City Care Management System
            </footer>

            <InfoDrawer
                isOpen={drawerOpen === 'waste'}
                onClose={() => setDrawerOpen(null)}
                title="Waste Segregation Guide"
                content={wasteInfoContent}
            />
            <InfoDrawer
                isOpen={drawerOpen === 'contact'}
                onClose={() => setDrawerOpen(null)}
                title="Contact Support"
                content={contactContent}
            />
        </div>
    );
};

export default Home;
