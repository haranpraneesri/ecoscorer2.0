import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, AlertCircle, Clock, Anchor, Activity } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useTelemetry } from '../context/TelemetryContext';

const BehaviorPage = () => {
    const {
        connected,
        behavior,
        ecoScore,
        telemetry,
        dailyStats
    } = useTelemetry();

    // Safe destructure with defaults
    const speed = telemetry?.speed ?? 0;
    const overallScore = ecoScore?.overall ?? 75;
    const harshBrakingCount = dailyStats?.harshBrakingCount ?? 0;
    const rapidAccelCount = dailyStats?.rapidAccelCount ?? 0;
    const overSpeedingCount = dailyStats?.overSpeedingCount ?? 0;
    const idleTimeSeconds = dailyStats?.idleTimeSeconds ?? 0;

    const harshBraking = behavior?.harshBraking ?? false;
    const harshAcceleration = behavior?.harshAcceleration ?? false;
    const overSpeeding = behavior?.overSpeeding ?? false;

    const [activeTab, setActiveTab] = useState('behavior');
    const [historyData, setHistoryData] = useState([]);

    // Update chart data when telemetry changes
    useEffect(() => {
        if (connected && speed > 0) {
            setHistoryData(prev => {
                const newPoint = {
                    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    score: overallScore,
                    speed: speed
                };
                const updated = [...prev, newPoint];
                return updated.slice(-30);
            });
        }
    }, [connected, speed, overallScore]);

    const behaviorEvents = [
        { type: 'Harsh Braking', count: harshBrakingCount, icon: Anchor, color: 'orange', active: harshBraking },
        { type: 'Rapid Accel', count: rapidAccelCount, icon: TrendingUp, color: 'red', active: harshAcceleration },
        { type: 'Over Speeding', count: overSpeedingCount, icon: AlertCircle, color: 'purple', active: overSpeeding },
        { type: 'Idle Time', count: Math.floor(idleTimeSeconds), icon: Clock, color: 'cyan', active: false },
    ];

    const hasActiveAlert = harshBraking || harshAcceleration || overSpeeding;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Driving Analysis</h1>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {connected ? 'Live' : 'Offline'}
                    </div>
                    <div className="flex p-1 bg-white/5 rounded-xl backdrop-blur-md border border-white/10">
                        <button
                            onClick={() => setActiveTab('behavior')}
                            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${activeTab === 'behavior' ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]' : 'text-muted-foreground hover:text-white'}`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => setActiveTab('trends')}
                            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${activeTab === 'trends' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(157,78,221,0.5)]' : 'text-muted-foreground hover:text-white'}`}
                        >
                            Live Chart
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'behavior' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {behaviorEvents.map((event, index) => (
                        <GlassCard
                            key={index}
                            className={`p-6 relative overflow-hidden group ${event.active ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
                            neonColor={event.active ? 'red' : event.color}
                            delay={index}
                        >
                            {event.active && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-bounce">
                                    ACTIVE!
                                </div>
                            )}
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <event.icon size={100} className="text-white" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                                    <event.icon size={24} className={`text-${event.color === 'cyan' ? 'neon-cyan' : event.color === 'purple' ? 'neon-purple' : 'white'}`} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-muted-foreground">{event.type}</h3>
                                    <p className="text-4xl font-bold text-white mt-2">{event.count}</p>
                                </div>
                                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-${event.color === 'cyan' ? 'neon-cyan' : event.color === 'purple' ? 'neon-purple' : 'white'} shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300`}
                                        style={{ width: `${Math.min((event.count / 10) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </GlassCard>
                    ))}

                    <GlassCard className="md:col-span-2 lg:col-span-4 p-8 flex items-center gap-6" neonColor={hasActiveAlert ? 'red' : 'cyan'}>
                        <div className={`w-16 h-16 rounded-full ${hasActiveAlert ? 'bg-red-500/20 animate-pulse' : 'bg-neon-cyan/20'} flex items-center justify-center`}>
                            {hasActiveAlert
                                ? <AlertTriangle className="text-red-400" size={32} />
                                : <Activity className="text-neon-cyan" size={32} />
                            }
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {hasActiveAlert ? '⚠️ Driving Alert' : '✅ Driving Smoothly'}
                            </h3>
                            <p className="text-muted-foreground">
                                {hasActiveAlert
                                    ? 'Aggressive driving detected! Ease off for better fuel efficiency and safety.'
                                    : connected
                                        ? 'Great job! Your driving style is efficient and eco-friendly.'
                                        : 'Connect your vehicle to see real-time driving analysis.'
                                }
                            </p>
                        </div>
                    </GlassCard>
                </div>
            ) : (
                <GlassCard className="p-6 md:p-8 min-h-[400px]" neonColor="purple" hoverEffect={false}>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="text-neon-purple" /> Live Driving Data
                    </h3>
                    <div className="h-[300px] w-full">
                        {historyData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9D4EDD" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#9D4EDD" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="time" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                                    <YAxis stroke="#666" tick={{ fill: '#888' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(10, 10, 35, 0.9)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        name="EcoScore"
                                        stroke="#9D4EDD"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="speed"
                                        name="Speed"
                                        stroke="#00FFFF"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSpeed)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <p>{connected ? 'Collecting data...' : 'Connect vehicle to see live chart'}</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}
        </div>
    );
};

export default BehaviorPage;
