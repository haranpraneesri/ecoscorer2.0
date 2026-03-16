import React, { useState, useEffect } from 'react';
import { Gauge, Fuel, Thermometer, Wind, Activity, Zap, AlertTriangle, TrendingUp, Leaf, ChevronDown, Calendar, Globe, Award } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
    const { user } = useAuth();
    const {
        connected,
        receiving,
        telemetry,
        behavior,
        emissions,
        ecoScore,
        carName,
        dailyStats,
        fuelSaved,
        co2Limit
    } = useTelemetry();

    // Period toggle
    const [period, setPeriod] = useState('daily');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [historySummary, setHistorySummary] = useState(null);

    const periodLabels = { daily: 'Today', weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };

    // Fetch history when period changes
    useEffect(() => {
        if (!user?.id || period === 'daily') {
            setHistorySummary(null);
            return;
        }
        api.get(`/leaderboard/report/history?userId=${user.id}&period=${period}`)
            .then(res => {
                if (res.data?.success) setHistorySummary(res.data.summary || null);
            })
            .catch(err => console.error('Dashboard history error:', err.message));
    }, [user?.id, period]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClick = () => setDropdownOpen(false);
        setTimeout(() => document.addEventListener('click', handleClick), 0);
        return () => document.removeEventListener('click', handleClick);
    }, [dropdownOpen]);

    // Safe destructure
    const speed = telemetry?.speed ?? 0;
    const rpm = telemetry?.rpm ?? 0;
    const throttlePos = telemetry?.throttlePos ?? 0;
    const brakePos = telemetry?.brakePos ?? 0;
    const fuel = telemetry?.fuel ?? 100;
    const gear = telemetry?.gear ?? 0;
    const coolantTemp = telemetry?.coolantTemp ?? 30;
    const airIntake = telemetry?.airIntake ?? 28;
    const engineLoad = telemetry?.engineLoad ?? 0;

    // Period-aware stats
    const isLive = period === 'daily';
    const overallScore = isLive ? (ecoScore?.overall ?? 0) : (historySummary?.avgEcoScore ?? 0);
    const totalCO2 = isLive ? (dailyStats?.totalCO2 ?? 0) : (historySummary?.totalCO2 ?? 0);
    const totalFuelUsed = isLive ? (dailyStats?.totalFuelUsed ?? 0) : (historySummary?.totalFuel ?? 0);
    const totalDistanceKm = isLive ? (dailyStats?.totalDistanceKm ?? 0) : (historySummary?.totalDistance ?? 0);
    const driveTimeSeconds = dailyStats?.driveTimeSeconds ?? 0;
    const harshBrakingCount = dailyStats?.harshBrakingCount ?? 0;
    const rapidAccelCount = dailyStats?.rapidAccelCount ?? 0;
    const overSpeedingCount = dailyStats?.overSpeedingCount ?? 0;
    const idleTimeSeconds = dailyStats?.idleTimeSeconds ?? 0;

    // Sub-scores (only meaningful for Today)
    const efficiencySubScore = isLive ? (ecoScore?.efficiency ?? 0) : null;
    const smoothnessSubScore = isLive ? (ecoScore?.smoothness ?? 0) : null;
    const fuelSubScore = isLive ? (ecoScore?.fuelScore ?? 0) : null;

    // Fuel saved
    const periodFuelSaved = isLive
        ? (fuelSaved ?? 0)
        : (totalDistanceKm > 0 ? Math.max(0, (0.08 - totalFuelUsed / totalDistanceKm) * totalDistanceKm) : 0);

    // CO2 per km
    const co2PerKm = totalDistanceKm > 0 ? (totalCO2 * 1000) / totalDistanceKm : 0;

    // Format hours:minutes
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}:${String(mins).padStart(2, '0')}`;
    };

    const safeCarName = carName ?? 'Waiting...';
    const dailyLimit = co2Limit ?? 28;
    const emissionProgress = Math.min((totalCO2 / dailyLimit) * 100, 100);

    // Score color
    const getScoreColor = (score) => {
        if (!score || score === 0) return '#ffffff';
        if (score > 70) return '#00ff88';
        if (score > 40) return '#ffaa00';
        return '#ff4444';
    };

    // Score label
    const getScoreLabel = (score) => {
        if (!score || score === 0) return 'No Data';
        if (score >= 90) return 'Excellent 🌿';
        if (score >= 70) return 'Good 👍';
        if (score >= 50) return 'Average ⚡';
        if (score >= 30) return 'Poor 😟';
        return 'Critical 🔴';
    };

    const gauges = [
        { label: 'Speed', value: speed.toFixed(0), unit: 'km/h', icon: Gauge, color: 'cyan', max: 200 },
        { label: 'RPM', value: rpm, unit: '', icon: Activity, color: 'purple', max: 8000 },
        { label: 'Throttle', value: throttlePos.toFixed(0), unit: '%', icon: Zap, color: 'green', max: 100 },
        { label: 'Brake', value: brakePos.toFixed(0), unit: '%', icon: AlertTriangle, color: 'red', max: 100 },
    ];

    const metrics = [
        { label: 'Fuel Level', value: fuel.toFixed(0), unit: 'L', icon: Fuel },
        { label: 'Coolant Temp', value: coolantTemp.toFixed(0), unit: '°C', icon: Thermometer },
        { label: 'Air Intake', value: airIntake.toFixed(0), unit: '°C', icon: Wind },
        { label: 'Engine Load', value: engineLoad.toFixed(0), unit: '%', icon: Activity },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Live Dashboard</h1>
                    <p className="text-muted-foreground mt-1">{safeCarName} • Gear: {gear === 0 ? 'N' : gear === -1 ? 'R' : gear}</p>
                </div>
                <div className="flex items-center gap-3" style={{ position: 'relative', zIndex: 100 }}>
                    <div className="relative" style={{ zIndex: 100 }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 text-white hover:from-white/15 hover:to-white/10 transition-all shadow-lg"
                        >
                            <Calendar size={14} className="text-neon-cyan" />
                            <span className="text-sm font-medium">{periodLabels[period]}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {dropdownOpen && (
                            <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-40 rounded-2xl bg-gray-900 border border-white/20 shadow-2xl overflow-hidden" style={{ zIndex: 9999 }}>
                                {Object.entries(periodLabels).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={(e) => { e.stopPropagation(); setPeriod(key); setDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-all flex items-center justify-between ${period === key ? 'text-neon-cyan bg-neon-cyan/10 font-medium' : 'text-white/80'}`}
                                    >
                                        <span>{label}</span>
                                        {period === key && <div className="w-2 h-2 rounded-full bg-neon-cyan" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} ${receiving ? 'animate-pulse' : ''}`} />
                        {connected ? (receiving ? 'Receiving' : 'Connected') : 'Offline'}
                    </div>
                </div>
            </div>

            {/* EcoScore + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="md:col-span-1 p-6 flex flex-col items-center justify-center relative overflow-hidden" neonColor="green">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neon-green/5 to-transparent" />
                    <p className="text-sm text-muted-foreground mb-2 relative z-10">EcoScore • {periodLabels[period]}</p>
                    <div className="relative w-28 h-28 z-10">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle
                                cx="56" cy="56" r="48"
                                fill="none"
                                stroke={getScoreColor(overallScore)}
                                strokeWidth="8"
                                strokeDasharray={`${(overallScore / 100) * 301.6} 301.6`}
                                strokeLinecap="round"
                                className="transition-all duration-700"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{overallScore > 0 ? Math.round(overallScore) : '--'}</span>
                        </div>
                    </div>
                    <p className="mt-2 text-sm font-semibold z-10" style={{ color: getScoreColor(overallScore) }}>
                        {getScoreLabel(overallScore)}
                    </p>
                </GlassCard>

                <GlassCard className="p-6 hover:scale-[1.02] transition-transform" neonColor="purple" delay={1}>
                    <div className="flex items-center gap-2 mb-2">
                        <Globe size={16} className="text-neon-purple" />
                        <p className="text-sm text-muted-foreground">Total CO2</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalCO2.toFixed(2)}<span className="text-lg text-muted-foreground">kg</span></p>
                    <p className="text-xs text-muted-foreground mt-2">{co2PerKm.toFixed(0)} g/km avg</p>
                </GlassCard>

                <GlassCard className="p-6 hover:scale-[1.02] transition-transform" neonColor="cyan" delay={2}>
                    <div className="flex items-center gap-2 mb-2">
                        <Fuel size={16} className="text-neon-cyan" />
                        <p className="text-sm text-muted-foreground">Fuel Saved</p>
                    </div>
                    <p className="text-3xl font-bold text-neon-green">{periodFuelSaved.toFixed(2)}<span className="text-lg text-muted-foreground">L</span></p>
                    <p className="text-xs text-muted-foreground mt-2">Used: {totalFuelUsed.toFixed(2)} L total</p>
                </GlassCard>

                <GlassCard className="p-6 hover:scale-[1.02] transition-transform" neonColor={emissionProgress > 80 ? 'red' : emissionProgress > 50 ? 'orange' : 'green'} delay={3}>
                    <p className="text-sm text-muted-foreground mb-2">{periodLabels[period]} Distance</p>
                    <p className="text-3xl font-bold text-white">{totalDistanceKm.toFixed(1)}<span className="text-lg text-muted-foreground">km</span></p>
                    {isLive && (
                        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${emissionProgress > 80 ? 'bg-red-500' : emissionProgress > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${emissionProgress}%` }}
                            />
                        </div>
                    )}
                    {isLive && <p className="text-xs text-muted-foreground mt-1">CO2: {totalCO2.toFixed(2)}/{dailyLimit}kg</p>}
                </GlassCard>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-5 hover:scale-[1.02] transition-transform" neonColor="purple" delay={0}>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe size={14} className="text-neon-purple" />
                        <p className="text-xs text-muted-foreground">Total CO2</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalCO2.toFixed(2)}<span className="text-sm text-muted-foreground">kg</span></p>
                    <p className="text-xs text-muted-foreground mt-1">{totalDistanceKm.toFixed(1)} km</p>
                </GlassCard>
                <GlassCard className="p-5 hover:scale-[1.02] transition-transform" neonColor="cyan" delay={1}>
                    <div className="flex items-center gap-2 mb-1">
                        <Fuel size={14} className="text-neon-cyan" />
                        <p className="text-xs text-muted-foreground">Fuel Saved</p>
                    </div>
                    <p className="text-2xl font-bold text-neon-green">{periodFuelSaved.toFixed(2)}<span className="text-sm text-muted-foreground">L</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Used: {totalFuelUsed.toFixed(2)} L</p>
                </GlassCard>
                <GlassCard className="p-5 hover:scale-[1.02] transition-transform" neonColor="orange" delay={2}>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-orange-400" />
                        <p className="text-xs text-muted-foreground">Drive Time</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{isLive ? formatTime(driveTimeSeconds) : '--:--'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Idle: {isLive ? formatTime(idleTimeSeconds) : '--:--'}</p>
                </GlassCard>
                <GlassCard className="p-5 hover:scale-[1.02] transition-transform" neonColor={emissionProgress > 80 ? 'red' : emissionProgress > 50 ? 'orange' : 'green'} delay={3}>
                    <div className="flex items-center gap-2 mb-1">
                        <Award size={14} className="text-neon-green" />
                        <p className="text-xs text-muted-foreground">CO2 / km</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{co2PerKm.toFixed(0)}<span className="text-sm text-muted-foreground">g</span></p>
                    <p className="text-xs text-muted-foreground mt-1">Avg: 140 g/km global</p>
                </GlassCard>
            </div>

            {/* Live Gauges — only show when receiving */}
            {(receiving || speed > 0 || rpm > 0) && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {gauges.map((gauge, index) => (
                            <GlassCard key={gauge.label} className="p-6 hover:scale-[1.02] transition-transform" neonColor={gauge.color} delay={index}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg bg-neon-${gauge.color}/20`}>
                                        <gauge.icon size={20} className={`text-neon-${gauge.color}`} />
                                    </div>
                                    <span className="text-muted-foreground">{gauge.label}</span>
                                </div>
                                <p className="text-4xl font-bold text-white">{gauge.value}<span className="text-lg text-muted-foreground">{gauge.unit}</span></p>
                                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-neon-${gauge.color} rounded-full transition-all duration-200`}
                                        style={{ width: `${Math.min((parseFloat(gauge.value) / gauge.max) * 100, 100)}%` }}
                                    />
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {metrics.map((metric, index) => (
                            <GlassCard key={metric.label} className="p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform" neonColor="cyan" delay={index}>
                                <div className="p-2 rounded-lg bg-white/5">
                                    <metric.icon size={20} className="text-neon-cyan" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                                    <p className="text-xl font-bold text-white">{metric.value}{metric.unit}</p>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </>
            )}

            {/* Behavior Alert */}
            {behavior && Object.values(behavior).some(v => v) && (
                <GlassCard className="p-6 flex items-center gap-6" neonColor="red">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="text-red-400" size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">⚠️ Driving Alert</h3>
                        <p className="text-muted-foreground">
                            {behavior?.harshBraking && '🛑 Harsh Braking! '}
                            {behavior?.harshAcceleration && '🚀 Rapid Acceleration! '}
                            {behavior?.overSpeeding && '⚡ Over Speeding! '}
                        </p>
                    </div>
                </GlassCard>
            )}

            {/* Session Summary */}
            <GlassCard className="p-6" neonColor="purple">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-neon-purple" /> {periodLabels[period]} Summary
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                        { label: 'km Driven', value: totalDistanceKm.toFixed(1) },
                        { label: 'kg CO2', value: totalCO2.toFixed(2) },
                        { label: 'L Fuel', value: totalFuelUsed.toFixed(2) },
                        { label: 'Harsh Brakes', value: isLive ? harshBrakingCount : '--' },
                        { label: 'Hard Accels', value: isLive ? rapidAccelCount : '--' },
                        { label: 'Overspeeds', value: isLive ? overSpeedingCount : '--' },
                    ].map((item, i) => (
                        <div key={i} className="text-center p-3 rounded-xl bg-white/5">
                            <p className="text-xl font-bold text-white">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};

export default DashboardPage;
