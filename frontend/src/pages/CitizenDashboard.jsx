import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { createComplaint } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import DashboardLayout from '../components/DashboardLayout';
import { CheckCircle2, MapPin, Camera, Check, AlertTriangle } from 'lucide-react';

const CitizenDashboard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        complainant_name: '',
        location_address: '',
        location_coords: '',
        image_before: null
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast("Geolocation not supported by your browser", "error");
            return;
        }
        toast("Fetching location...", "info");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
                const address = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                setFormData(prev => ({ ...prev, location_coords: coords, location_address: address }));
                toast("Location captured!", "success");
            },
            (err) => {
                let msg = "Could not get location.";
                if (err.code === 1) msg = "Location permission denied. Please allow location access or type the address manually.";
                else if (err.code === 2) msg = "Location unavailable. Try again or type the address manually.";
                else if (err.code === 3) msg = "Location request timed out. Try again.";
                toast(msg, "error");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image_before: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const data = new FormData();
        data.append('complainant_name', formData.complainant_name);
        data.append('location_coords', formData.location_coords);
        data.append('location_address', formData.location_address);
        if (formData.image_before) {
            data.append('image_before', formData.image_before);
        }

        try {
            const res = await createComplaint(data);
            setSuccess(res.data);
        } catch (err) {
            const resData = err.response?.data;
            let errorMsg = "Failed to submit complaint";

            if (resData) {
                if (resData.error) {
                    errorMsg = resData.error;
                } else if (resData.detail) {
                    errorMsg = resData.detail;
                } else {
                    const errors = Object.values(resData).flat();
                    if (errors.length > 0) {
                        errorMsg = errors.join(', ');
                    }
                }
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Citizen Dashboard" role="citizen">
            <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <GlassCard>
                            <h2 className="text-xl font-bold mb-6 text-cyan-300">Report an Issue</h2>

                            {success ? (
                                <div className="text-center py-10">
                                    <div className="text-5xl mb-4"><CheckCircle2 className="w-5 h-5 inline-block" /></div>
                                    <h3 className="text-2xl font-bold mb-2">Complaint Submitted!</h3>
                                    <p className="text-white/70 mb-6">
                                        {success.is_duplicate
                                            ? "A similar complaint already exists. We've increased the urgency."
                                            : "We have received your request."}
                                    </p>
                                    <div className="bg-white/10 p-4 rounded-lg mb-6 inline-block">
                                        <span className="text-sm text-white/50 block">Reference ID</span>
                                        <span
                                            className="text-xl font-mono text-cyan-300 cursor-pointer hover:text-cyan-200"
                                            title="Click to copy"
                                            onClick={() => {
                                                navigator.clipboard.writeText(success.complaint.complaint_id);
                                                toast("Reference ID copied!", "success");
                                            }}
                                        >
                                            {success.complaint.complaint_id}
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => navigate(`/track/${success.complaint.complaint_id}`)}
                                            className="flex-1 py-3 bg-cyan-700 rounded-lg hover:bg-cyan-600 transition"
                                        >
                                            Track Your Complaint
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSuccess(null);
                                                setPreview(null);
                                                setFormData({ complainant_name: '', location_address: '', location_coords: '', image_before: null });
                                            }}
                                            className="flex-1 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition"
                                        >
                                            Submit New Complaint
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="complaint-name" className="block text-sm text-white/70 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            id="complaint-name"
                                            value={formData.complainant_name}
                                            onChange={(e) => setFormData({ ...formData, complainant_name: e.target.value })}
                                            className="w-full"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="complaint-location" className="block text-sm text-white/70 mb-2">Location</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="complaint-location"
                                                value={formData.location_address}
                                                onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                                                placeholder="Type your address or use Locate Me"
                                                className="w-full"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGetLocation}
                                                aria-label="Get current location"
                                                className="px-4 bg-blue-600 rounded-lg hover:bg-blue-500 transition whitespace-nowrap"
                                            >
                                                <MapPin className="w-5 h-5 inline-block" /> Locate Me
                                            </button>
                                        </div>
                                        {formData.location_coords ? (
                                            <p className="text-xs text-green-400 mt-2"><Check className="w-4 h-4 inline-block text-green-400" /> Coords locked: {formData.location_coords}</p>
                                        ) : (
                                            <p className="text-xs text-white/40 mt-2">Optional — click "Locate Me" to capture GPS coordinates</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm text-white/70 mb-2">Photo Evidence</label>
                                        <div className="border border-dashed border-white/30 rounded-lg p-6 text-center hover:bg-white/5 transition relative">
                                            <input
                                                type="file"
                                                onChange={handleImageChange}
                                                accept="image/*"
                                                aria-label="Upload photo evidence (optional)"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            {preview ? (
                                                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                            ) : (
                                                <div className="text-white/50">
                                                    <p className="text-2xl mb-2"><Camera className="w-5 h-5 inline-block" /></p>
                                                    <p>Click to upload photo</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full py-3 rounded-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-[1.02] transition ${loading ? 'opacity-50' : ''}`}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Complaint'}
                                    </button>
                                </form>
                            )}
                        </GlassCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                    >
                        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-blue-300 mb-2">How it Works</h3>
                            <ul className="space-y-3 text-sm text-white/70">
                                <li className="flex gap-2">
                                    <span className="text-cyan-400">1.</span> Snap a photo of the waste/garbage.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-cyan-400">2.</span> Use location button to tag GPS coords.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-cyan-400">3.</span> Submit! Inspectors will assign it.
                                </li>
                            </ul>
                        </div>

                        <GlassCard className="bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Smart Detection</h4>
                                    <p className="text-xs text-white/60">System automatically detects duplicate complaints within 50m and escalates priority instead of creating spam.</p>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CitizenDashboard;
