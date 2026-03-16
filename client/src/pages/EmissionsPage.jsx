import React, { useState, useEffect } from 'react';
import { TreePine, Cloud, Globe, ArrowUpRight, Leaf, TrendingUp, Activity, Gauge, ChevronDown, Calendar, BarChart3, Zap, Droplets } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EmissionsPage = () => {
    const { user } = useAuth();
    const {
        connected,
        receiving,
        emissions,
        dailyStats,
        telemetry,
        ecoScore,
        fuelSaved: contextFuelSaved
    } = useTelemetry();

    // Period toggle state
    const [period, setPeriod] = useState('daily');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [historySummary, setHistorySummary] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Live emission rates
    const co2Rate = emissions?.co2 ?? 0;
    const noxRate = emissions?.nox ?? 0;
    const speed = telemetry?.speed ?? 0;
    const maf = telemetry?.maf ?? 0;
    const rpm = telemetry?.rpm ?? 0;

    // PERIOD-AWARE stats — use history summary when not "daily", else use live dailyStats
    const isLive = period === 'daily';
    const periodCO2 = isLive ? (dailyStats?.totalCO2 ?? 0) : (historySummary?.totalCO2 ?? 0);
    const periodDistance = isLive ? (dailyStats?.totalDistanceKm ?? 0) : (historySummary?.totalDistance ?? 0);
    const periodFuel = isLive ? (dailyStats?.totalFuelUsed ?? 0) : (historySummary?.totalFuel ?? 0);
    const periodEcoScore = isLive ? (ecoScore?.overall ?? 0) : (historySummary?.avgEcoScore ?? 0);

    // Trees to offset — always based on average daily CO2 rate
    const daysInPeriod = isLive ? 1 : (historySummary?.daysCount ?? 1);
    const avgDailyCO2 = daysInPeriod > 0 ? periodCO2 / daysInPeriod : periodCO2;
    const yearlyEstimateCO2 = avgDailyCO2 * 365;
    const offsetTrees = periodCO2 > 0 ? Math.max(1, Math.ceil(yearlyEstimateCO2 / 21)) : 0;

    // CO2 reduced vs global average (140 g/km)
    // Use average from driven distance when available, fall back to live rate
    const avgCO2PerKm = periodDistance > 0
        ? (periodCO2 * 1000) / periodDistance
        : (receiving ? co2Rate : 0);
    const co2ReducedKg = periodDistance > 0 ? Math.max(0, (140 - avgCO2PerKm) * periodDistance / 1000) : 0;

    // Fuel saved — daily uses context value (compared to yesterday), others vs global avg
    const periodFuelSaved = isLive
        ? (contextFuelSaved ?? 0)
        : (periodDistance > 0 ? Math.max(0, (0.08 - periodFuel / periodDistance) * periodDistance) : 0);
    const fuelSavedLabel = isLive ? 'vs yesterday' : `vs avg (8 L/100km)`;

    // Efficiency
    const fuelEfficiency = periodDistance > 0 ? (periodFuel / periodDistance) * 100 : 0;

    // EcoScore color — white when no data
    const getScoreColor = (score) => {
        if (!score || score === 0) return 'text-white';
        if (score > 70) return 'text-neon-green';
        if (score > 40) return 'text-orange-400';
        return 'text-red-400';
    };

    // Impact level — use avgCO2PerKm when distance available, else live rate
    const impactSource = avgCO2PerKm;

    // Impact level
    const getImpactLevel = (rate) => {
        if (rate <= 0) return "Waiting...";
        if (rate < 80) return "Excellent";
        if (rate < 120) return "Good";
        if (rate < 180) return "Average";
        if (rate < 250) return "High";
        return "Critical";
    };
    const impactLevel = getImpactLevel(impactSource);
    const impactColors = {
        "Excellent": "green", "Good": "cyan", "Average": "orange",
        "High": "red", "Critical": "red", "Waiting...": "purple"
    };
    const impactColor = impactColors[impactLevel] || "purple";

    const periodLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
    const periodDescriptions = {
        daily: 'Last 7 days', weekly: 'Last 4 weeks', monthly: 'Last 12 months', yearly: 'All time'
    };

    // Fetch history data when period changes
    useEffect(() => {
        if (!user?.id) return;
        setLoadingHistory(true);
        api.get(`/leaderboard/report/history?userId=${user.id}&period=${period}`)
            .then(res => {
                if (res.data?.success) {
                    setHistoryData(res.data.data || []);
                    setHistorySummary(res.data.summary || null);
                }
            })
            .catch(err => console.error('History fetch error:', err.message))
            .finally(() => setLoadingHistory(false));
    }, [user?.id, period]);

    // Max CO2 for chart scaling
    const maxCO2 = historyData && historyData.length > 0
        ? Math.max(...historyData.map(d => d.totalCO2), 0.1) : 1;

    const actionItems = [
        { title: "Smooth Driving", icon: Leaf, desc: "Avoid rapid acceleration", color: "green" },
        { title: "Optimal Speed", icon: TrendingUp, desc: "Maintain 60-80 km/h", color: "cyan" },
        { title: "Engine Braking", icon: Activity, desc: "Release throttle early", color: "purple" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    Emissions Monitor
                </h1>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} ${receiving ? 'animate-pulse' : ''}`} />
                    {connected ? (receiving ? 'Live' : 'Connected') : 'Offline'}
                </div>
            </div>

            {/* Live Emissions Display */}
            <GlassCard className="p-8 relative overflow-hidden" neonColor={impactColor}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-neon-green/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <h2 className="text-xl font-medium text-muted-foreground">Environmental Status</h2>
                        <div className="inline-block relative">
                            <span className={`text-4xl md:text-5xl font-display font-bold text-neon-${impactColor} drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]`}>
                                {impactLevel}
                            </span>
                            {receiving && <div className={`absolute -top-4 -right-4 w-3 h-3 bg-neon-${impactColor} rounded-full animate-ping`} />}
                        </div>
                        <p className="text-muted-foreground max-w-lg">
                            {avgCO2PerKm > 0
                                ? `Avg: ${avgCO2PerKm.toFixed(1)} g/km${receiving ? ` | Live: ${co2Rate.toFixed(1)} g/km @ ${speed.toFixed(0)} km/h` : ''} | Total: ${periodCO2.toFixed(3)} kg`
                                : "Start driving to see live emissions data"
                            }
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-sm hover:bg-white/10 transition-all">
                            <p className="text-sm text-muted-foreground">CO2 Rate</p>
                            <p className="text-2xl font-bold text-white">{co2Rate.toFixed(0)}<span className="text-sm text-muted-foreground">g/km</span></p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center backdrop-blur-sm hover:bg-white/10 transition-all">
                            <p className="text-sm text-muted-foreground">NOx</p>
                            <p className="text-2xl font-bold text-white">{noxRate.toFixed(1)}<span className="text-sm text-muted-foreground">mg/km</span></p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Period Toggle Header */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-neon-cyan" />
                    <h2 className="text-xl font-bold text-white">Emission Reports</h2>
                </div>
                <p className="text-sm text-muted-foreground hidden md:block">• {periodDescriptions[period]}</p>
                <div className="relative ml-auto">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 text-white hover:from-white/15 hover:to-white/10 transition-all shadow-lg"
                    >
                        <Calendar size={16} className="text-neon-cyan" />
                        <span className="font-medium">{periodLabels[period]}</span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-gray-900/95 border border-white/20 shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                            {Object.entries(periodLabels).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => { setPeriod(key); setDropdownOpen(false); }}
                                    className={`w-full text-left px-5 py-3.5 text-sm hover:bg-white/10 transition-all flex items-center justify-between ${period === key ? 'text-neon-cyan bg-neon-cyan/10 font-medium' : 'text-white/80'}`}
                                >
                                    <span>{label}</span>
                                    {period === key && <div className="w-2 h-2 rounded-full bg-neon-cyan" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Period Stats Cards — ALL values sync with period */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <GlassCard className="p-5 flex flex-col items-center text-center gap-1 group hover:scale-[1.02] transition-transform" neonColor="purple" delay={0}>
                    <div className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Globe size={24} className="text-neon-purple" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{periodCO2.toFixed(2)}<span className="text-sm text-muted-foreground">kg</span></h3>
                    <p className="text-xs text-muted-foreground">{periodLabels[period]} CO2</p>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col items-center text-center gap-1 group hover:scale-[1.02] transition-transform" neonColor="green" delay={1}>
                    <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Leaf size={24} className="text-neon-green" />
                    </div>
                    <h3 className="text-2xl font-bold text-neon-green">{co2ReducedKg.toFixed(2)}<span className="text-sm text-muted-foreground">kg</span></h3>
                    <p className="text-xs text-muted-foreground">CO2 Reduced</p>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col items-center text-center gap-1 group hover:scale-[1.02] transition-transform" neonColor="orange" delay={2}>
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Gauge size={24} className="text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{periodDistance.toFixed(1)}<span className="text-sm text-muted-foreground">km</span></h3>
                    <p className="text-xs text-muted-foreground">Distance</p>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col items-center text-center gap-1 group hover:scale-[1.02] transition-transform" neonColor="cyan" delay={3}>
                    <div className="w-12 h-12 rounded-full bg-neon-cyan/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Droplets size={24} className="text-neon-cyan" />
                    </div>
                    <h3 className="text-2xl font-bold text-neon-green">
                        {periodFuelSaved.toFixed(2)}<span className="text-sm text-muted-foreground">L</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">Fuel Saved</p>
                    <p className="text-xs text-muted-foreground opacity-70">{fuelSavedLabel}</p>
                </GlassCard>

                <GlassCard className="p-5 flex flex-col items-center text-center gap-1 group hover:scale-[1.02] transition-transform col-span-2 md:col-span-1" neonColor="green" delay={4}>
                    <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Zap size={24} className="text-neon-green" />
                    </div>
                    <h3 className={`text-2xl font-bold ${getScoreColor(periodEcoScore)}`}>
                        {periodEcoScore > 0 ? Math.round(periodEcoScore) : '--'}
                    </h3>
                    <p className="text-xs text-muted-foreground">EcoScore</p>
                    {periodEcoScore === 0 && <p className="text-xs text-muted-foreground opacity-70">No drive yet</p>}
                </GlassCard>
            </div>

            {/* History Chart */}
            <GlassCard className="p-6" neonColor="cyan">
                {loadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : historyData && historyData.length > 0 ? (
                    <div>
                        <h3 className="text-sm text-muted-foreground font-medium mb-4">CO2 Emissions ({periodLabels[period]})</h3>
                        <div className="space-y-2.5">
                            {historyData.map((item, index) => {
                                const barWidth = (item.totalCO2 / maxCO2) * 100;
                                const barColor = item.totalCO2 < 1 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                    item.totalCO2 < 3 ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' :
                                        item.totalCO2 < 5 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                            'bg-gradient-to-r from-red-500 to-red-400';
                                const formatLabel = () => {
                                    if (period === 'daily') return new Date(item.label).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
                                    if (period === 'monthly') {
                                        const [y, m] = item.label.split('-');
                                        return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                                    }
                                    return item.label;
                                };
                                return (
                                    <div key={index} className="flex items-center gap-3 group">
                                        <span className="text-xs text-muted-foreground w-28 shrink-0 truncate group-hover:text-white transition-colors">
                                            {formatLabel()}
                                        </span>
                                        <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden relative">
                                            <div
                                                className={`h-full ${barColor} rounded-lg transition-all duration-700`}
                                                style={{ width: `${Math.max(barWidth, 3)}%`, animationDelay: `${index * 100}ms` }}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium drop-shadow">
                                                {item.totalCO2.toFixed(2)} kg
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Globe size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground">No emission data for this period</p>
                        <p className="text-sm text-muted-foreground mt-1">Drive with telemetry connected to start tracking</p>
                    </div>
                )}
            </GlassCard>

            {/* Trees to Offset & Impact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex flex-col items-center text-center gap-2 group hover:scale-[1.02] transition-transform" neonColor="green" delay={0}>
                    <div className="w-16 h-16 rounded-full bg-neon-green/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <TreePine size={36} className="text-neon-green" />
                    </div>
                    <h3 className="text-4xl font-bold text-white">{offsetTrees}</h3>
                    <p className="text-sm text-muted-foreground">Trees to Offset/Year</p>
                    <p className="text-xs text-muted-foreground">based on {periodLabels[period].toLowerCase()} rate</p>
                </GlassCard>

                <GlassCard className="p-6 flex flex-col items-center text-center gap-2 group hover:scale-[1.02] transition-transform" neonColor="cyan" delay={1}>
                    <div className="w-16 h-16 rounded-full bg-neon-cyan/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Cloud size={36} className="text-neon-cyan" />
                    </div>
                    <h3 className="text-4xl font-bold text-white">{Math.max(0, Math.min(100, 100 - (avgCO2PerKm / 2))).toFixed(0)}%</h3>
                    <p className="text-sm text-muted-foreground">Efficiency Score</p>
                    <p className="text-xs text-muted-foreground">{avgCO2PerKm.toFixed(0)} g/km avg</p>
                </GlassCard>

                <GlassCard className="p-6 flex flex-col items-center text-center gap-2 group hover:scale-[1.02] transition-transform" neonColor="purple" delay={2}>
                    <div className="w-16 h-16 rounded-full bg-neon-purple/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Gauge size={36} className="text-neon-purple" />
                    </div>
                    <h3 className="text-4xl font-bold text-white">{fuelEfficiency.toFixed(1)}</h3>
                    <p className="text-sm text-muted-foreground">L/100km</p>
                    <p className="text-xs text-muted-foreground">Fuel Efficiency</p>
                </GlassCard>
            </div>

            {/* Live Calculation Info */}
            {connected && receiving && (
                <GlassCard className="p-6" neonColor="cyan">
                    <h3 className="text-lg font-bold text-white mb-4">📊 Live Calculation Data</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-xl font-bold text-white">{maf.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">MAF (g/s)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-xl font-bold text-white">{rpm}</p>
                            <p className="text-xs text-muted-foreground">RPM</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-xl font-bold text-white">{(dailyStats?.totalFuelUsed ?? 0).toFixed(3)}</p>
                            <p className="text-xs text-muted-foreground">Fuel Used (L)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                            <p className="text-xl font-bold text-white">{((dailyStats?.totalCO2 ?? 0) * 1000).toFixed(0)}</p>
                            <p className="text-xs text-muted-foreground">Total CO2 (g)</p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Eco Tips */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 pl-2 border-l-4 border-neon-cyan">Reduce Emissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {actionItems.map((item, index) => (
                        <GlassCard key={index} className="p-6 flex flex-col gap-4 group cursor-pointer hover:scale-[1.02] transition-transform" neonColor={item.color} delay={index}>
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-xl bg-neon-${item.color}/10`}>
                                    <item.icon className={`text-neon-${item.color}`} size={24} />
                                </div>
                                <ArrowUpRight className="text-muted-foreground group-hover:text-white transition-colors" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmissionsPage;
