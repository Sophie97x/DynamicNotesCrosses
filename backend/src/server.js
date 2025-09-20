const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { checkWin } = require('./gameLogic.js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    // Use URL constructor to parse pathname
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        // If the path is not for our WebSocket server, destroy the socket
        socket.destroy();
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
        currentTurn: 'X',
        moveHistory: [] // Add move history for each game
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
                    currentTurn: 'X',
                    moveHistory: [] // Initialize move history
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
                            // Update board and history
                            game.board[data.position] = playerMark;
                            game.moveHistory.push(data.position);

                            // Implement the 6-move rule
                            let fadingPiece = null;
                            if (game.moveHistory.length > 5) {
                                const oldestMoveIndex = game.moveHistory.shift();
                                game.board[oldestMoveIndex] = null;
                            }
                            if (game.moveHistory.length === 5) {
                                fadingPiece = game.moveHistory[0];
                            }
                            
                            // Switch turns
                            game.currentTurn = playerMark === 'X' ? 'O' : 'X';

                            // Broadcast the full game state to both players
                            const gameStatePayload = {
                                type: 'gameState',
                                board: game.board,
                                currentTurn: game.currentTurn,
                                fadingPiece: fadingPiece
                            };

                            game.players.forEach(player => {
                                if (player.readyState === WebSocket.OPEN) {
                                    player.send(JSON.stringify(gameStatePayload));
                                }
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
