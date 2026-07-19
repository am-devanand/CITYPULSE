import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';

const InfoDrawer = ({ isOpen, onClose, title, content }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleCopy = async () => {
        const text = content
            ? [content.heading, content.body, ...(content.items || [])].filter(Boolean).join('\n')
            : '';
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // silently fail
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full md:w-[400px] z-50 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl overflow-y-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{title}</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        aria-label="Copy to clipboard"
                                        className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        aria-label="Close drawer"
                                        className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {content && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-cyan-300">{content.heading}</h3>
                                    {content.body && (
                                        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{content.body}</p>
                                    )}
                                    {content.items && content.items.length > 0 && (
                                        <ul className="space-y-2">
                                            {content.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                                                    <span className="text-cyan-400 mt-0.5">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default InfoDrawer;
