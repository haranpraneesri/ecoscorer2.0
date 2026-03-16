import React from 'react';

const Gauge = ({
    value,
    max = 100,
    label,
    unit,
    color = "cyan", // cyan, purple, green, orange, red
    size = "medium" // small, medium, large
}) => {
    // Calculate percentage and clamp between 0-100
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    // SVG configuration
    const sizeMap = {
        small: 80,
        medium: 120,
        large: 200
    };

    const width = sizeMap[size];
    const strokeWidth = width / 10;
    const radius = (width - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    // Colors
    const colorMap = {
        cyan: { start: "#00FFFF", end: "#0088FF" },
        purple: { start: "#9D4EDD", end: "#6A00F4" },
        green: { start: "#00FF88", end: "#00CC44" },
        orange: { start: "#FF9F43", end: "#FF6B6B" },
        red: { start: "#FF4757", end: "#FF0000" }
    };

    const selectedColor = colorMap[color] || colorMap.cyan;
    const uniqueId = `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="flex flex-col items-center justify-center relative">
            <svg width={width} height={width} className="transform -rotate-90">
                <defs>
                    <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={selectedColor.start} />
                        <stop offset="100%" stopColor={selectedColor.end} />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background Ring */}
                <circle
                    cx={width / 2}
                    cy={width / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress Ring */}
                <circle
                    cx={width / 2}
                    cy={width / 2}
                    r={radius}
                    stroke={`url(#${uniqueId})`}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    filter="url(#glow)"
                />
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ fontSize: width * 0.25 }}>
                    {Math.round(value)}
                </span>
                {unit && (
                    <span className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: width * 0.1 }}>
                        {unit}
                    </span>
                )}
            </div>

            {/* Label below */}
            {label && (
                <div className="mt-2 text-center">
                    <span className="text-sm font-medium text-neon-cyan uppercase tracking-wider glow-text">
                        {label}
                    </span>
                </div>
            )}
        </div>
    );
};

export default Gauge;
