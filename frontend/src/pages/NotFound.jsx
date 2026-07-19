import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center text-white p-8">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-xl text-white/60 mb-2">Page not found</p>
            <p className="text-white/40 mb-8">The page you're looking for doesn't exist.</p>
            <Link to="/" className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition text-white">
                Go Home
            </Link>
        </div>
    );
};

export default NotFound;
