import io from 'socket.io-client';

// Connect to Railway cloud server
const SERVER_URL = "https://ecoscorer-production.up.railway.app";

const socket = io(SERVER_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling']
});

export default socket;
