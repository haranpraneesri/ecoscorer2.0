import React from 'react';
import { cn } from '../../lib/utils';

const GlassCard = ({
    children,
    className,
    hoverEffect = true,
    neonColor = "cyan", // cyan, purple, green, red
    delay = 0
}) => {

    const glowColors = {
        cyan: "hover:shadow-[0_12px_48px_rgba(0,255,255,0.2)] hover:border-neon-cyan/50",
        purple: "hover:shadow-[0_12px_48px_rgba(157,78,221,0.2)] hover:border-neon-purple/50",
        green: "hover:shadow-[0_12px_48px_rgba(0,255,136,0.2)] hover:border-neon-green/50",
        orange: "hover:shadow-[0_12px_48px_rgba(255,159,67,0.2)] hover:border-status-warning/50",
        red: "hover:shadow-[0_12px_48px_rgba(255,71,87,0.2)] hover:border-status-danger/50",
        none: ""
    };

    return (
        <div
            className={cn(
                "relative rounded-3xl backdrop-blur-md border border-white/15 bg-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out",
                hoverEffect && "hover:-translate-y-2",
                hoverEffect && glowColors[neonColor],
                className
            )}
            style={{
                animation: hoverEffect ? `float 6s ease-in-out infinite ${delay}s` : 'none'
            }}
        >
            {/* Glossy overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
