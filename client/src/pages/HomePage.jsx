import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../context/TelemetryContext';
import { Activity, TrendingUp, Award, Leaf, WifiOff, Globe, ChevronDown, Calendar, Droplets, Target, Fuel, Zap } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import Gauge from '../components/ui/Gauge';
import api from '../services/api';

const HomePage = () => {
    const { user } = useAuth();
    const {
        connected,
        receiving,
        ecoScore,
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
            .catch(err => console.error('Home history error:', err.message));
    }, [user?.id, period]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClick = () => setDropdownOpen(false);
        setTimeout(() => document.addEventListener('click', handleClick), 0);
        return () => document.removeEventListener('click', handleClick);
    }, [dropdownOpen]);

    // Period-aware stats
    const isLive = period === 'daily';
    const overallScore = isLive ? (ecoScore?.overall ?? 0) : (historySummary?.avgEcoScore ?? 0);
    const totalCO2 = isLive ? (dailyStats?.totalCO2 ?? 0) : (historySummary?.totalCO2 ?? 0);
    const totalDistance = isLive ? (dailyStats?.totalDistanceKm ?? 0) : (historySummary?.totalDistance ?? 0);
    const totalFuel = isLive ? (dailyStats?.totalFuelUsed ?? 0) : (historySummary?.totalFuel ?? 0);
    const dailyLimit = co2Limit ?? 28;

    // Sub-scores from ecoScore context (only meaningful for Today)
    const efficiencyScore = isLive ? (ecoScore?.efficiency ?? 0) : null;
    const smoothnessScore = isLive ? (ecoScore?.smoothness ?? 0) : null;
    const fuelScoreVal = isLive ? (ecoScore?.fuelScore ?? 0) : null;

    // Derived metrics
    const co2PerKm = totalDistance > 0 ? (totalCO2 * 1000) / totalDistance : 0;
    const fuelPer100km = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;
    const periodFuelSaved = isLive
        ? (fuelSaved ?? 0)
        : (totalDistance > 0 ? Math.max(0, (0.08 - totalFuel / totalDistance) * totalDistance) : 0);

    // Score styling
    const getScoreColor = (score) => {
        if (!score || score === 0) return 'cyan';
        if (score >= 70) return 'green';
        if (score >= 40) return 'orange';
        return 'red';
    };
    const getScoreLabel = (score) => {
        if (!score || score === 0) return 'Start Driving';
        if (score >= 90) return 'Excellent 🌿';
        if (score >= 70) return 'Good Driver 👍';
        if (score >= 50) return 'Average ⚡';
        if (score >= 30) return 'Needs Work 😟';
        return 'Critical 🔴';
    };

    const scoreColor = getScoreColor(overallScore);
    const emissionProgress = dailyLimit > 0 ? Math.min((totalCO2 / dailyLimit) * 100, 100) : 0;

    const quickLinks = [
        { title: 'Live Dash', icon: Activity, path: '/live', color: 'cyan', delay: 0 },
        { title: 'Analysis', icon: TrendingUp, path: '/behavior', color: 'purple', delay: 1 },
        { title: 'Impact', icon: Leaf, path: '/emissions', color: 'green', delay: 2 },
        { title: 'Leaderboard', icon: Award, path: '/leaderboard', color: 'orange', delay: 3 },
    ];

    return (
        <div className="space-y-8 pb-8">
            {/* Period Toggle */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-muted-foreground">Overview</h2>
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
                        <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-gray-900 border border-white/20 shadow-2xl overflow-hidden" style={{ zIndex: 9999 }}>
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
            </div>

            {/* Hero: Welcome + EcoScore Gauge */}
            <GlassCard className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8" neonColor="cyan">
                <div className="space-y-4 text-center md:text-left">
                    <h1 className="text-3xl md:text-5xl font-bold font-display text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Welcome, <span className="text-neon-cyan">{user?.username || 'Pilot'}</span>
                    </h1>
                    <p className={`text-xl font-semibold text-neon-${scoreColor}`}>
                        {getScoreLabel(overallScore)}
                    </p>
                    <p className="text-muted-foreground">
                        {overallScore > 0
                            ? `${totalDistance.toFixed(1)} km • ${totalCO2.toFixed(2)} kg CO2 • ${periodLabels[period]}`
                            : 'Connect your OBD to start scoring your drive.'
                        }
                    </p>
                    <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                        <div className={`px-3 py-1.5 rounded-full ${connected ? 'bg-green-500/20' : 'bg-red-500/20'} border border-white/10 flex items-center gap-2`}>
                            {connected ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                                    <span className="text-sm font-medium text-neon-green">{receiving ? 'Live Data' : 'Connected'}</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={12} className="text-red-400" />
                                    <span className="text-sm font-medium text-red-400">Offline</span>
                                </>
                            )}
                        </div>
                        {overallScore > 0 && (
                            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 flex items-center gap-2">
                                <Zap size={12} className={`text-neon-${scoreColor}`} />
                                <span className="text-sm font-medium text-white">{Math.round(overallScore)} / 100</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative group shrink-0">
                    <Gauge value={overallScore} size="large" color={scoreColor} label="EcoScore" unit="pts" />
                    <div className="absolute top-1/2 left-1/2 w-[240px] h-[240px] border border-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite]" />
                    <div className="absolute top-1/2 left-1/2 w-[240px] h-[240px] -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite]">
                        <div className="w-3 h-3 bg-neon-cyan rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#00ffff]" />
                    </div>
                </div>
            </GlassCard>



            {/* Stats Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total CO2', value: `${totalCO2.toFixed(2)} kg`, sub: `${co2PerKm.toFixed(0)} g/km`, icon: Globe, color: 'purple' },
                    { label: 'Distance', value: `${totalDistance.toFixed(1)} km`, sub: periodLabels[period], icon: Activity, color: 'cyan' },
                    { label: 'Fuel Used', value: `${totalFuel.toFixed(2)} L`, sub: `Saved: ${periodFuelSaved.toFixed(2)} L`, icon: Droplets, color: 'orange' },
                    { label: 'EcoScore', value: overallScore > 0 ? Math.round(overallScore) : '--', sub: getScoreLabel(overallScore), icon: Award, color: scoreColor },
                ].map((stat, i) => (
                    <GlassCard key={i} className="p-5 hover:scale-[1.02] transition-transform" neonColor={stat.color} delay={i}>
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon size={14} className={`text-neon-${stat.color}`} />
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Navigation Grid */}
            <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-neon-purple">Mission Control</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {quickLinks.map((link, index) => (
                    <Link key={index} to={link.path}>
                        <GlassCard
                            className="p-6 h-40 flex flex-col items-center justify-center gap-4 group cursor-pointer hover:scale-[1.02] transition-transform"
                            neonColor={link.color}
                            delay={link.delay}
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <link.icon size={32} className={`text-neon-${link.color}`} />
                            </div>
                            <span className="text-lg font-medium text-white tracking-wide">{link.title}</span>
                        </GlassCard>
                    </Link>
                ))}
            </div>

            {/* CO2 Progress Bar */}
            <GlassCard className="p-6" neonColor={emissionProgress > 80 ? 'red' : emissionProgress > 50 ? 'orange' : 'purple'}>
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-muted-foreground uppercase">{periodLabels[period]} CO2 Emission</span>
                    <span className={`font-bold ${emissionProgress > 80 ? 'text-red-400' : emissionProgress > 50 ? 'text-orange-400' : 'text-neon-cyan'}`}>
                        {totalCO2.toFixed(2)} kg {isLive ? `/ ${dailyLimit} kg` : ''}
                    </span>
                </div>
                <div className="h-4 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <div
                        className={`h-full rounded-full relative transition-all duration-500
                            ${emissionProgress > 80 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                                emissionProgress > 50 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                    'bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-purple'}`}
                        style={{ width: `${Math.max(2, emissionProgress)}%` }}
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 animate-pulse" />
                    </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{totalDistance.toFixed(1)} km driven</span>
                    <span>{totalFuel.toFixed(2)} L fuel used</span>
                </div>
            </GlassCard>
        </div>
    );
};

export default HomePage;
