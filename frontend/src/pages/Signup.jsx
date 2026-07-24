import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import api from '../api';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (formData.password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }

        setLoading(true);

        try {
            await api.post('/users/', {
                username: formData.username,
                password: formData.password,
                role: 'CITIZEN',
                phone: formData.phone,
            });

            navigate('/login/citizen');
        } catch (err) {
            if (!err.response) {
                setError('Unable to connect to server. Please check your internet connection.');
            } else if (err.response.status >= 500) {
                setError('Server error. Please try again later.');
            } else {
                const data = err.response?.data;
                if (typeof data === 'object' && data !== null) {
                    const messages = Object.values(data).flat().join(' ');
                    setError(messages || 'Registration failed. Please try again.');
                } else {
                    setError('Registration failed. Please try again.');
                }
            }
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
                        <h2 className="text-3xl font-bold mb-2">Citizen Sign Up</h2>
                        <p className="text-white/60">Create your citizen account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm text-center" role="alert" aria-live="assertive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">Username</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">Phone (optional)</label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full"
                                placeholder="+91-XXXXXXXXXX"
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
                                placeholder="Minimum 4 characters"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full"
                                placeholder="Re-enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg 
                                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'} 
                                bg-gradient-to-r from-cyan-500 to-blue-600 
                                transition-all duration-300`}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center space-y-2">
                        <p className="text-white/50 text-sm">
                            Already have an account?{' '}
                            <Link to="/login/citizen" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                Log in
                            </Link>
                        </p>
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

export default Signup;
