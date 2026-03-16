import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const useWebSocket = (vehicleId) => {
    const [socket, setSocket] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!vehicleId) return;

        const newSocket = io('http://localhost:3001');

        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);
            newSocket.emit('join_vehicle', vehicleId);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        });

        newSocket.on('telemetry_stream', (data) => {
            setTelemetry(data);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [vehicleId]);

    return { socket, telemetry, connected };
};

export default useWebSocket;
