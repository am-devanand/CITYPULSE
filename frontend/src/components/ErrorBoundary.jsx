import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center text-white p-8">
                    <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
                    <p className="text-white/60 mb-6">An unexpected error occurred</p>
                    <a href="/" className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition text-white">
                        Go Home
                    </a>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
