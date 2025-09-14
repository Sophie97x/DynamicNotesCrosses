const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { checkWin } = require('./gameLogic.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
    server, 
    path: '/ws',
    // Handle Cloudflare's proxy headers
    handleProtocols: (protocols, req) => {
        return protocols[0];
    },
    verifyClient: (info) => {
        // Accept connections from Cloudflare and local network
        const isCloudflare = info.req.headers['cf-connecting-ip'] !== undefined;
        const isLocalNetwork = info.req.headers.host.includes('192.168.0.50') || 
                             info.req.headers.host.includes('localhost') ||
                             info.req.headers.host.includes('xo.sophiewilson.site');
        return isCloudflare || isLocalNetwork;
    }
});

// Game state
const games = new Map(); // roomCode -> {players: [ws1, ws2], board: [], currentTurn: 'X'}
const queue = new Set(); // Players waiting for random match
const availableRooms = new Set(); // Rooms waiting for second player
const playerStats = {
    online: 0,
    inQueue: 0
};

function broadcastStats() {
    const stats = {
        type: 'stats',
        playersOnline: playerStats.online,
        playersInQueue: playerStats.inQueue
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(stats));
        }
    });
}

function createRoom(player1, player2) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    games.set(roomCode, {
        players: [player1, player2],
        board: Array(9).fill(null),
        currentTurn: 'X'
    });
    
    // Notify players
    player1.send(JSON.stringify({
        type: 'matched',
        roomCode: roomCode,
        playerMark: 'X'
    }));
    
    player2.send(JSON.stringify({
        type: 'matched',
        roomCode: roomCode,
        playerMark: 'O'
    }));
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    playerStats.online++;
    broadcastStats();

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {
            case 'getStats':
                ws.send(JSON.stringify({
                    type: 'stats',
                    playersOnline: playerStats.online,
                    playersInQueue: playerStats.inQueue
                }));
                break;
                
            case 'queue':
                queue.add(ws);
                playerStats.inQueue++;
                broadcastStats();
                ws.send(JSON.stringify({ type: 'queue' }));
                
                // Check if we can match players
                if (queue.size >= 2) {
                    const players = Array.from(queue).slice(0, 2);
                    players.forEach(player => {
                        queue.delete(player);
                        playerStats.inQueue--;
                    });
                    createRoom(players[0], players[1]);
                    broadcastStats();
                }
                break;
                
            case 'join':
                if (data.roomCode) {
                    const game = games.get(data.roomCode);
                    if (game && game.players.length < 2) {
                        game.players.push(ws);
                        availableRooms.delete(data.roomCode);
                        ws.send(JSON.stringify({
                            type: 'matched',
                            roomCode: data.roomCode,
                            playerMark: 'O'
                        }));
                        // Notify first player that opponent joined
                        game.players[0].send(JSON.stringify({
                            type: 'matched',
                            roomCode: data.roomCode,
                            playerMark: 'X'
                        }));
                    } else {
                        ws.send(JSON.stringify({ type: 'roomFull' }));
                    }
                }
                break;
                
            case 'createRoom':
                const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                games.set(newRoomCode, {
                    players: [ws],
                    board: Array(9).fill(null),
                    currentTurn: 'X'
                });
                availableRooms.add(newRoomCode);
                ws.send(JSON.stringify({
                    type: 'roomCreated',
                    roomCode: newRoomCode
                }));
                break;
                
            case 'getRooms':
                ws.send(JSON.stringify({
                    type: 'availableRooms',
                    rooms: Array.from(availableRooms)
                }));
                break;
                
            case 'move':
                if (data.roomCode) {
                    const game = games.get(data.roomCode);
                    if (game) {
                        const playerIndex = game.players.indexOf(ws);
                        const playerMark = playerIndex === 0 ? 'X' : 'O';

                        // Check if it's the player's turn
                        if (game.currentTurn === playerMark && game.board[data.position] === null) {
                            // Update board
                            game.board[data.position] = playerMark;
                            
                            // Switch turns
                            game.currentTurn = playerMark === 'X' ? 'O' : 'X';

                            // Broadcast the move to both players
                            game.players.forEach(player => {
                                player.send(JSON.stringify({
                                    type: 'gameState',
                                    board: game.board,
                                    currentTurn: game.currentTurn
                                }));
                            });

                            // Check for win/draw
                            const winner = checkWin(game.board);
                            if (winner) {
                                game.players.forEach(player => {
                                    player.send(JSON.stringify({ type: 'gameOver', winner }));
                                });
                                games.delete(data.roomCode);
                            } else if (!game.board.includes(null)) {
                                game.players.forEach(player => {
                                    player.send(JSON.stringify({ type: 'gameOver', winner: 'draw' }));
                                });
                                games.delete(data.roomCode);
                            }
                        } else {
                            // It's not their turn or the cell is taken
                            ws.send(JSON.stringify({ type: 'invalidMove' }));
                        }
                    }
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        playerStats.online--;
        queue.delete(ws);
        playerStats.inQueue = queue.size;
        broadcastStats();
        
        // Clean up any games this player was in
        for (const [roomCode, game] of games.entries()) {
            if (game.players.includes(ws)) {
                const opponent = game.players.find(p => p !== ws);
                if (opponent) {
                    opponent.send(JSON.stringify({ type: 'opponent_left' }));
                }
                games.delete(roomCode);
            }
        }
    });
});

const PORT = 8080;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
