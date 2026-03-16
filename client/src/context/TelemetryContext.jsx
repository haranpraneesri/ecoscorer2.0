import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TelemetryContext = createContext(null);

// Get today's date key for daily storage
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Get yesterday's date key
const getYesterdayKey = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
};

// Global average CO2 per km for reference
const GLOBAL_AVG_CO2_PER_KM = 140;
const GLOBAL_AVG_FUEL_PER_KM = 0.08;

// Helper to create user-specific storage keys
const getStorageKey = (userId, date) => `ecoscorer_user_${userId}_daily_${date}`;
const getSettingsKey = (userId) => `ecoscorerSettings_user_${userId}`;

// Default empty stats
const createEmptyStats = (date) => ({
    date,
    totalCO2: 0,
    totalDistanceKm: 0,
    totalFuelUsed: 0,
    avgEcoScore: 0,
    ecoScoreSamples: 0,
    harshBrakingCount: 0,
    rapidAccelCount: 0,
    overSpeedingCount: 0,
    idleTimeSeconds: 0,
    driveTimeSeconds: 0
});

export const useTelemetry = () => {
    const context = useContext(TelemetryContext);
    if (!context) {
        return {
            connected: false,
            receiving: false,
            telemetry: { speed: 0, rpm: 0, throttlePos: 0, brakePos: 0, fuel: 100, gear: 0, maf: 0, engineLoad: 0, airIntake: 28, coolantTemp: 30 },
            behavior: { harshBraking: false, harshAcceleration: false, overSpeeding: false },
            emissions: { co2: 0, nox: 0, hc: 0, pm: 0 },
            ecoScore: { overall: 0, efficiency: 0, smoothness: 0, emissions: 0 },
            carName: 'No Vehicle',
            dailyStats: createEmptyStats(getTodayKey()),
            yesterdayStats: null,
            co2Reduced: 0,
            fuelSaved: 0,
            co2Limit: 28,
            resetDailyStats: () => { }
        };
    }
    return context;
};

export const TelemetryProvider = ({ children }) => {
    const { user } = useAuth();
    const userId = user?.id;

    const [connected, setConnected] = useState(false);
    const [receiving, setReceiving] = useState(false);
    const [co2Limit, setCo2Limit] = useState(28);

    // Load user-specific settings
    useEffect(() => {
        if (!userId) return;

        const loadSettings = () => {
            try {
                // Try user-specific settings first
                let saved = localStorage.getItem(getSettingsKey(userId));
                // Fallback to global settings
                if (!saved) saved = localStorage.getItem('ecoscorerSettings');

                if (saved) {
                    const settings = JSON.parse(saved);
                    setCo2Limit(settings.co2Limit || 28);
                }
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        };

        loadSettings();
        const interval = setInterval(loadSettings, 2000);
        return () => clearInterval(interval);
    }, [userId]);

    // Telemetry state
    const [telemetry, setTelemetry] = useState({
        speed: 0, rpm: 0, throttlePos: 0, brakePos: 0, fuel: 100,
        gear: 0, maf: 0, engineLoad: 0, airIntake: 28, coolantTemp: 30
    });

    const [behavior, setBehavior] = useState({
        harshBraking: false, harshAcceleration: false, overSpeeding: false
    });

    const [emissions, setEmissions] = useState({ co2: 0, nox: 0, hc: 0, pm: 0 });
    const [ecoScore, setEcoScore] = useState({ overall: 0, efficiency: 0, smoothness: 0, emissions: 0 });
    const [carName, setCarName] = useState('Waiting...');

    // User-specific daily stats
    const [dailyStats, setDailyStats] = useState(createEmptyStats(getTodayKey()));
    const [yesterdayStats, setYesterdayStats] = useState(null);
    const prevBehaviorRef = useRef({ harshBraking: false, harshAcceleration: false, overSpeeding: false });

    // Load user-specific daily stats when user changes
    useEffect(() => {
        if (!userId) {
            setDailyStats(createEmptyStats(getTodayKey()));
            setYesterdayStats(null);
            return;
        }

        const today = getTodayKey();
        const yesterday = getYesterdayKey();

        // Load today's stats for this user
        try {
            const savedToday = localStorage.getItem(getStorageKey(userId, today));
            if (savedToday) {
                const parsed = JSON.parse(savedToday);
                setDailyStats({
                    date: today,
                    totalCO2: parsed.totalCO2 || 0,
                    totalDistanceKm: parsed.totalDistanceKm || 0,
                    totalFuelUsed: parsed.totalFuelUsed || 0,
                    avgEcoScore: parsed.avgEcoScore || 75,
                    ecoScoreSamples: parsed.ecoScoreSamples || 0,
                    harshBrakingCount: parsed.harshBrakingCount || 0,
                    rapidAccelCount: parsed.rapidAccelCount || 0,
                    overSpeedingCount: parsed.overSpeedingCount || 0,
                    idleTimeSeconds: parsed.idleTimeSeconds || 0,
                    driveTimeSeconds: parsed.driveTimeSeconds || 0
                });
            } else {
                setDailyStats(createEmptyStats(today));
            }
        } catch (e) {
            setDailyStats(createEmptyStats(today));
        }

        // Load yesterday's stats for this user
        try {
            const savedYesterday = localStorage.getItem(getStorageKey(userId, yesterday));
            if (savedYesterday) {
                setYesterdayStats(JSON.parse(savedYesterday));
            } else {
                setYesterdayStats(null);
            }
        } catch (e) {
            setYesterdayStats(null);
        }
    }, [userId]);

    // Save daily stats when they change (user-specific)
    useEffect(() => {
        if (!userId || !dailyStats.date) return;
        try {
            localStorage.setItem(getStorageKey(userId, dailyStats.date), JSON.stringify(dailyStats));
        } catch (e) { }
    }, [userId, dailyStats]);

    // Check for new day and reset
    useEffect(() => {
        if (!userId) return;
        const today = getTodayKey();
        if (dailyStats.date && dailyStats.date !== today) {
            // Save current as yesterday
            localStorage.setItem(getStorageKey(userId, dailyStats.date), JSON.stringify(dailyStats));
            setYesterdayStats(dailyStats);
            setDailyStats(createEmptyStats(today));
        }
    }, [userId, dailyStats.date, dailyStats]);

    // Handle telemetry updates
    const handleTelemetry = useCallback((data) => {
        if (data.userId !== userId) return;

        setReceiving(true);
        setCarName(data.carName || "Unknown Car");

        setTelemetry({
            speed: data.speed || 0,
            rpm: data.rpm || 0,
            throttlePos: data.throttlePos || 0,
            brakePos: data.brakePos || 0,
            fuel: data.fuel || 0,
            gear: data.gear || 0,
            maf: data.maf || 0,
            engineLoad: data.engineLoad || 0,
            airIntake: data.airIntake || 28,
            coolantTemp: data.coolantTemp || 30
        });

        if (data.emissions) {
            setEmissions({
                co2: data.emissions.co2 || 0,
                nox: data.emissions.nox || 0,
                hc: data.emissions.hc || 0,
                pm: data.emissions.pm || 0
            });
        }

        if (data.ecoScore) {
            if (typeof data.ecoScore === 'object') {
                setEcoScore({
                    overall: data.ecoScore.overall || 0,
                    efficiency: data.ecoScore.efficiency || 0,
                    smoothness: data.ecoScore.smoothness || 0,
                    emissions: data.ecoScore.emissions || 0
                });
            } else {
                setEcoScore(prev => ({ ...prev, overall: data.ecoScore || 0 }));
            }
        }

        if (data.behavior) {
            const newBehavior = data.behavior;
            const prevBehavior = prevBehaviorRef.current;

            const harshBrakingNew = newBehavior.harshBraking && !prevBehavior.harshBraking ? 1 : 0;
            const rapidAccelNew = newBehavior.harshAcceleration && !prevBehavior.harshAcceleration ? 1 : 0;
            const overSpeedingNew = newBehavior.overSpeeding && !prevBehavior.overSpeeding ? 1 : 0;

            if (harshBrakingNew || rapidAccelNew || overSpeedingNew) {
                setDailyStats(prev => ({
                    ...prev,
                    harshBrakingCount: prev.harshBrakingCount + harshBrakingNew,
                    rapidAccelCount: prev.rapidAccelCount + rapidAccelNew,
                    overSpeedingCount: prev.overSpeedingCount + overSpeedingNew
                }));
            }

            prevBehaviorRef.current = newBehavior;
            setBehavior(newBehavior);
        }

        // Accumulate daily stats
        const updateInterval = 0.1;
        const speed = data.speed || 0;
        const maf = data.maf || 0;
        const rpm = data.rpm || 0;

        const distanceKm = (speed / 3600) * updateInterval;

        let co2Grams = 0;
        let fuelLiters = 0;

        if (maf > 0) {
            const fuelRateGs = maf / 14.7;
            const fuelRateGrams = fuelRateGs * updateInterval;
            fuelLiters = fuelRateGrams / 740;
            co2Grams = fuelRateGrams * 3.15;
        } else if (rpm > 0 && speed > 0) {
            const co2PerKm = data.emissions?.co2 || 0;
            co2Grams = co2PerKm * distanceKm;
            fuelLiters = (co2Grams / 3.15) / 740;
        }

        const co2Kg = co2Grams / 1000;
        const isIdling = speed < 5 && rpm > 500;
        const currentScore = typeof data.ecoScore === 'object'
            ? (data.ecoScore?.overall || 0)
            : (data.ecoScore || 0);

        setDailyStats(prev => {
            const newSamples = prev.ecoScoreSamples + 1;
            const newAvgScore = ((prev.avgEcoScore * prev.ecoScoreSamples) + currentScore) / newSamples;

            return {
                ...prev,
                totalDistanceKm: prev.totalDistanceKm + distanceKm,
                totalCO2: prev.totalCO2 + co2Kg,
                totalFuelUsed: prev.totalFuelUsed + fuelLiters,
                avgEcoScore: newAvgScore,
                ecoScoreSamples: newSamples,
                driveTimeSeconds: prev.driveTimeSeconds + updateInterval,
                idleTimeSeconds: prev.idleTimeSeconds + (isIdling ? updateInterval : 0)
            };
        });
    }, [userId]);

    // Socket connection
    useEffect(() => {
        if (!userId) return;

        const handleConnect = () => {
            setConnected(true);
            socket.emit('subscribe_user', userId);
        };

        const handleDisconnect = () => {
            setConnected(false);
            setReceiving(false);
        };

        if (socket.connected) handleConnect();

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('telemetry_stream', handleTelemetry);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('telemetry_stream', handleTelemetry);
        };
    }, [userId, handleTelemetry]);

    // Auto-save daily report to server every 30 seconds
    // NOTE: we expose computedEcoScore for saving, so we need to compute it inline here too
    const getComputedScore = (stats) => {
        if (stats.totalDistanceKm <= 0) return 0;
        const co2PerKm = (stats.totalCO2 * 1000) / stats.totalDistanceKm;
        const efficiencyScore = Math.max(0, Math.min(100, 100 - (co2PerKm / 1.4)));
        const totalEvents = stats.harshBrakingCount + stats.rapidAccelCount + stats.overSpeedingCount;
        const eventsPerKm = stats.totalDistanceKm > 0 ? totalEvents / stats.totalDistanceKm : 0;
        const smoothnessScore = Math.max(0, Math.min(100, 100 - (eventsPerKm * 30)));
        const fuelPerKm = stats.totalFuelUsed / stats.totalDistanceKm;
        const fuelScore = Math.max(0, Math.min(100, 100 - ((fuelPerKm - 0.04) / 0.001)));
        return Math.round(efficiencyScore * 0.4 + smoothnessScore * 0.35 + fuelScore * 0.25);
    };

    useEffect(() => {
        if (!userId) return;
        const interval = setInterval(() => {
            if (dailyStats.totalDistanceKm > 0 || dailyStats.totalCO2 > 0) {
                const realScore = getComputedScore(dailyStats);
                api.post('/leaderboard/report', {
                    userId,
                    date: dailyStats.date,
                    totalDistance: dailyStats.totalDistanceKm,
                    totalFuel: dailyStats.totalFuelUsed,
                    totalCO2: dailyStats.totalCO2,
                    avgEcoScore: realScore
                }).catch(err => console.error('Auto-save report error:', err.message));
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [userId, dailyStats]);

    // Load saved report from server on login
    useEffect(() => {
        if (!userId) return;
        api.get(`/leaderboard/report/latest?userId=${userId}`)
            .then(res => {
                if (res.data?.success && res.data.report) {
                    const r = res.data.report;
                    const today = getTodayKey();
                    // Only restore if we have no local data for today
                    if (dailyStats.totalDistanceKm === 0 && dailyStats.totalCO2 === 0) {
                        setDailyStats(prev => ({
                            ...prev,
                            date: today,
                            totalDistanceKm: r.totalDistance || 0,
                            totalFuelUsed: r.totalFuel || 0,
                            totalCO2: r.totalCO2 || 0,
                            avgEcoScore: r.avgEcoScore || 0
                        }));
                    }
                }
            })
            .catch(err => console.error('Load report error:', err.message));
    }, [userId]);

    // Calculate REAL EcoScore from driving data
    const computedEcoScore = (() => {
        // Return zeros when no driving data at all
        if (dailyStats.totalDistanceKm <= 0 && !receiving) {
            return { overall: 0, efficiency: 0, smoothness: 0, fuelScore: 0 };
        }

        const co2PerKm = dailyStats.totalDistanceKm > 0
            ? (dailyStats.totalCO2 * 1000) / dailyStats.totalDistanceKm
            : (emissions?.co2 || 0);

        // CO2 Efficiency: 100 at 0 g/km, 0 at 140 g/km (global avg), penalizes heavy emitters
        const efficiencyScore = Math.max(0, Math.min(100, 100 - (co2PerKm / 1.4)));

        // Smoothness: events per KM driven (not per minute — more fair for long drives)
        const totalEvents = dailyStats.harshBrakingCount + dailyStats.rapidAccelCount + dailyStats.overSpeedingCount;
        const eventsPerKm = dailyStats.totalDistanceKm > 0 ? totalEvents / dailyStats.totalDistanceKm : 0;
        const smoothnessScore = Math.max(0, Math.min(100, 100 - (eventsPerKm * 30)));

        // Fuel Efficiency: 100 at 4L/100km, 0 at ~10L/100km
        const fuelPerKm = dailyStats.totalDistanceKm > 0 ? dailyStats.totalFuelUsed / dailyStats.totalDistanceKm : 0;
        const fuelScore = dailyStats.totalDistanceKm > 0
            ? Math.max(0, Math.min(100, 100 - ((fuelPerKm - 0.04) / 0.001)))
            : 0;

        // Weighted overall: CO2 (40%) + Smoothness (35%) + Fuel (25%)
        const overall = Math.round(efficiencyScore * 0.4 + smoothnessScore * 0.35 + fuelScore * 0.25);

        return {
            overall: Math.max(0, Math.min(100, overall)),
            efficiency: Math.round(efficiencyScore),
            smoothness: Math.round(smoothnessScore),
            fuelScore: Math.round(fuelScore)
        };
    })();

    // Calculated values
    const yourCo2PerKm = dailyStats.totalDistanceKm > 0
        ? (dailyStats.totalCO2 * 1000) / dailyStats.totalDistanceKm
        : 0;
    const co2Reduced = dailyStats.totalDistanceKm > 0
        ? Math.max(0, (GLOBAL_AVG_CO2_PER_KM - yourCo2PerKm) * dailyStats.totalDistanceKm / 1000)
        : 0;

    let fuelSaved = 0;
    if (dailyStats.totalDistanceKm > 0) {
        const yourFuelPerKm = dailyStats.totalFuelUsed / dailyStats.totalDistanceKm;
        let compareFuelPerKm = GLOBAL_AVG_FUEL_PER_KM;
        if (yesterdayStats && yesterdayStats.totalDistanceKm > 0) {
            const yesterdayFuelPerKm = (yesterdayStats.totalFuelUsed || 0) / yesterdayStats.totalDistanceKm;
            if (yesterdayFuelPerKm > 0) compareFuelPerKm = yesterdayFuelPerKm;
        }
        fuelSaved = Math.max(0, (compareFuelPerKm - yourFuelPerKm) * dailyStats.totalDistanceKm);
    }

    const value = {
        connected,
        receiving,
        telemetry,
        behavior,
        emissions,
        ecoScore: computedEcoScore,
        carName,
        dailyStats,
        yesterdayStats,
        co2Reduced,
        fuelSaved,
        co2Limit,
        resetDailyStats: () => {
            if (!userId) return;
            const today = getTodayKey();
            const newStats = createEmptyStats(today);
            setDailyStats(newStats);
            localStorage.setItem(getStorageKey(userId, today), JSON.stringify(newStats));
        }
    };

    return (
        <TelemetryContext.Provider value={value}>
            {children}
        </TelemetryContext.Provider>
    );
};

export default TelemetryContext;
