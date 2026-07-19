import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hoverEffect = false, onClick }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && onClick) {
            onClick(e);
        }
    };

    return (
        <motion.div
            whileHover={hoverEffect ? { scale: 1.02, textShadow: "0px 0px 8px rgb(255,255,255)" } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`glass-card p-6 ${hoverEffect ? 'cursor-pointer hover:bg-white/20 hover:border-white/40' : ''} ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? handleKeyDown : undefined}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
