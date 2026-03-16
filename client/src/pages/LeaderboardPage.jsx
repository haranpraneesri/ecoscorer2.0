import React, { useState, useEffect } from 'react';
import { Award, Medal, Crown, User, TrendingUp, RefreshCw } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../context/TelemetryContext';

// API base URL
const API_URL = "https://ecoscorer-production.up.railway.app/api";

const LeaderboardPage = () => {
    const { user } = useAuth();
    const { dailyStats, ecoScore, co2Reduced } = useTelemetry();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch leaderboard from server
    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/leaderboard`);
            const data = await response.json();

            if (data.success && data.leaderboard) {
                setLeaderboard(data.leaderboard);
            } else {
                // Fallback to current user only if server returns empty
                setLeaderboard([{
                    id: user?.id || 1,
                    username: user?.username || 'You',
                    ecoScore: Math.round(dailyStats?.avgEcoScore || ecoScore?.overall || 75),
                    co2Saved: (co2Reduced || 0).toFixed(1),
                    totalDistance: (dailyStats?.totalDistanceKm || 0).toFixed(1),
                    sessionsCount: 1,
                    isCurrentUser: true
                }]);
            }
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            setError('Could not load leaderboard');
            // Fallback to current user
            setLeaderboard([{
                id: user?.id || 1,
                username: user?.username || 'You',
                ecoScore: Math.round(dailyStats?.avgEcoScore || ecoScore?.overall || 75),
                co2Saved: (co2Reduced || 0).toFixed(1),
                totalDistance: (dailyStats?.totalDistanceKm || 0).toFixed(1),
                sessionsCount: 1,
                isCurrentUser: true
            }]);
        }
        setLoading(false);
    };

    // Save current user's daily report to server for leaderboard
    const saveReport = async () => {
        if (!user?.id || !dailyStats?.date) return;

        try {
            await fetch(`${API_URL}/leaderboard/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    date: dailyStats.date,
                    totalDistance: dailyStats.totalDistanceKm || 0,
                    totalFuel: dailyStats.totalFuelUsed || 0,
                    totalCO2: dailyStats.totalCO2 || 0,
                    avgEcoScore: dailyStats.avgEcoScore || 75
                })
            });
        } catch (err) {
            console.error('Failed to save report:', err);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    // Save report when stats change significantly
    useEffect(() => {
        if (dailyStats?.totalDistanceKm > 0.1) {
            saveReport();
        }
    }, [dailyStats?.totalDistanceKm, user?.id]);

    // Mark current user in leaderboard
    const enrichedLeaderboard = leaderboard.map(entry => ({
        ...entry,
        isCurrentUser: entry.id === user?.id
    }));

    const topThree = enrichedLeaderboard.slice(0, 3);
    const others = enrichedLeaderboard.slice(3);

    // Find current user's rank
    const userRank = enrichedLeaderboard.findIndex(e => e.id === user?.id) + 1;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    Leaderboard
                </h1>
                <button
                    onClick={fetchLeaderboard}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    disabled={loading}
                >
                    <RefreshCw size={20} className={`text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* User's Rank Card */}
            {user && (
                <GlassCard className="p-6" neonColor="purple">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
                                <User size={24} className="text-neon-purple" />
                            </div>
                            <div>
                                <p className="text-white font-bold">{user.username}</p>
                                <p className="text-sm text-muted-foreground">Your Ranking</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-neon-purple">
                                #{userRank > 0 ? userRank : '-'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {Math.round(dailyStats?.avgEcoScore || ecoScore?.overall || 75)} pts
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <RefreshCw size={48} className="text-neon-cyan animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading rankings...</p>
                </div>
            ) : error ? (
                <GlassCard className="p-6 text-center" neonColor="orange">
                    <p className="text-orange-400">{error}</p>
                    <button
                        onClick={fetchLeaderboard}
                        className="mt-4 px-4 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30"
                    >
                        Retry
                    </button>
                </GlassCard>
            ) : leaderboard.length === 0 ? (
                <GlassCard className="p-8 text-center" neonColor="cyan">
                    <Award className="mx-auto mb-4 text-neon-cyan" size={48} />
                    <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
                    <p className="text-muted-foreground">
                        Start driving to appear on the leaderboard!
                    </p>
                </GlassCard>
            ) : (
                <>
                    {/* Podium */}
                    <div className="flex flex-col md:flex-row justify-center items-end gap-6 min-h-[280px]">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <GlassCard
                                className={`w-full md:w-1/3 flex flex-col items-center p-6 ${topThree[1].isCurrentUser ? 'ring-2 ring-neon-cyan' : ''}`}
                                neonColor="cyan" delay={1}
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-gray-300 to-gray-500 flex items-center justify-center border-2 border-gray-400 shadow-lg">
                                        <span className="text-xl font-bold text-white">2</span>
                                    </div>
                                    <Medal className="absolute -bottom-1 -right-1 text-gray-300" size={20} />
                                </div>
                                <h3 className="mt-3 text-lg font-bold text-white">{topThree[1].username}</h3>
                                <p className="text-neon-cyan font-mono">{topThree[1].ecoScore} pts</p>
                                <p className="text-xs text-muted-foreground">{topThree[1].co2Saved}kg saved</p>
                                {topThree[1].isCurrentUser && <span className="text-xs text-neon-cyan mt-1">← You</span>}
                            </GlassCard>
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <GlassCard
                                className={`w-full md:w-1/3 flex flex-col items-center p-8 scale-105 z-10 ${topThree[0].isCurrentUser ? 'ring-2 ring-yellow-400' : ''}`}
                                neonColor="purple" delay={0}
                            >
                                <Crown className="text-yellow-400 drop-shadow-lg animate-bounce mb-2" size={36} />
                                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 flex items-center justify-center border-4 border-yellow-400 shadow-lg">
                                    <span className="text-2xl font-bold text-white">1</span>
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
                                    {topThree[0].username}
                                </h3>
                                <p className="text-neon-purple font-mono text-lg font-bold">{topThree[0].ecoScore} pts</p>
                                <p className="text-sm text-muted-foreground">{topThree[0].co2Saved}kg saved</p>
                                {topThree[0].isCurrentUser && <span className="text-xs text-yellow-400 mt-1">← You</span>}
                            </GlassCard>
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <GlassCard
                                className={`w-full md:w-1/3 flex flex-col items-center p-6 ${topThree[2].isCurrentUser ? 'ring-2 ring-orange-400' : ''}`}
                                neonColor="orange" delay={2}
                            >
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-orange-400 to-orange-700 flex items-center justify-center border-2 border-orange-500 shadow-lg">
                                        <span className="text-xl font-bold text-white">3</span>
                                    </div>
                                    <Medal className="absolute -bottom-1 -right-1 text-orange-400" size={20} />
                                </div>
                                <h3 className="mt-3 text-lg font-bold text-white">{topThree[2].username}</h3>
                                <p className="text-orange-400 font-mono">{topThree[2].ecoScore} pts</p>
                                <p className="text-xs text-muted-foreground">{topThree[2].co2Saved}kg saved</p>
                                {topThree[2].isCurrentUser && <span className="text-xs text-orange-400 mt-1">← You</span>}
                            </GlassCard>
                        )}
                    </div>

                    {/* Rest of the list */}
                    {others.length > 0 && (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            {others.map((entry, index) => (
                                <GlassCard
                                    key={entry.id}
                                    className={`p-4 flex items-center justify-between ${entry.isCurrentUser ? 'ring-2 ring-neon-purple' : ''}`}
                                    neonColor="cyan"
                                    delay={index + 3}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 text-center font-mono text-muted-foreground">
                                            #{index + 4}
                                        </span>
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold">
                                            {entry.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-white">
                                            {entry.username}
                                            {entry.isCurrentUser && <span className="text-xs text-neon-cyan ml-2">(You)</span>}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-neon-cyan font-bold">{entry.ecoScore} pts</p>
                                        <p className="text-xs text-muted-foreground">{entry.co2Saved}kg saved</p>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LeaderboardPage;
