import React from 'react';
import { cn } from '../../lib/utils';

const NeonButton = ({
    children,
    onClick,
    variant = "primary", // primary, secondary, danger
    className,
    type = "button"
}) => {

    const variants = {
        primary: "bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-[0_4px_12px_rgba(0,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] border-none",
        secondary: "bg-white/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/10 hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]",
        danger: "bg-white/5 text-status-danger border border-status-danger/30 hover:bg-status-danger/10 hover:border-status-danger hover:shadow-[0_0_15px_rgba(255,71,87,0.3)]"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-xl px-6 py-3 font-medium transition-all duration-300 ease-out transform hover:scale-105 active:scale-95",
                variants[variant],
                className
            )}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>

            {/* Shine effect for primary */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
            )}
        </button>
    );
};

export default NeonButton;
