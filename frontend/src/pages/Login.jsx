import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const { loginUser } = useAuth();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordHints = {
        citizen: { user: 'guest', pass: 'guest' },
        inspector: { user: 'inspector', pass: 'admin' },
        collector: { user: 'collector1', pass: 'admin' },
        officer: { user: 'officer', pass: 'admin' },
    };

    const roleConfig = {
        citizen: { title: 'Citizen Login', bg: 'bg-citizen', redirect: '/citizen', btn: 'bg-gradient-to-r from-cyan-500 to-blue-600' },
        inspector: { title: 'Inspector Login', bg: 'bg-inspector', redirect: '/inspector', btn: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
        collector: { title: 'Collector Login', bg: 'bg-collector', redirect: '/collector', btn: 'bg-gradient-to-r from-orange-500 to-amber-600' },
        officer: { title: 'Officer Login', bg: 'bg-officer', redirect: '/officer', btn: 'bg-gradient-to-r from-purple-500 to-indigo-600' },
    };

    const config = roleConfig[role] || roleConfig.citizen;
    const hints = passwordHints[role] || passwordHints.citizen;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const roleUpper = { citizen: 'CITIZEN', inspector: 'INSPECTOR', collector: 'COLLECTOR', officer: 'OFFICER' }[role] || 'CITIZEN';

            const response = await login(formData.username, formData.password, roleUpper);

            loginUser(response.data.user);
            navigate(config.redirect);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md relative z-10"
            >
                <GlassCard className="border-t-4 border-t-white/50">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold mb-2">{config.title}</h2>
                        <p className="text-white/60">Enter your credentials to access the dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm text-center" role="alert" aria-live="assertive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">Username</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full"
                                placeholder={role === 'citizen' ? "Enter 'guest' for demo" : "Enter username"}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full"
                                placeholder={role === 'citizen' ? "Enter 'guest' for demo" : "Enter password"}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg 
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} 
                ${config.btn} 
                transition-all duration-300`}
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-white/50 space-y-2">
                        <p role="status">Demo {role?.charAt(0).toUpperCase() + role?.slice(1) || 'User'}: username: <strong>{hints.user}</strong> / password: <strong>{hints.pass}</strong></p>
                        {role === 'citizen' && (
                            <p className="text-white/40">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                                    Sign up
                                </Link>
                            </p>
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-white/50 hover:text-white transition-colors text-sm"
                        >
                            ← Back to Home
                        </button>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default Login;
