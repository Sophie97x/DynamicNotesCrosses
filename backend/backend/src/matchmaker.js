const { v4: uuidv4 } = require('uuid');

let queue = [];

function createRoom(player1, player2) {
  const roomId = uuidv4();
  return { id: roomId, players: [{ ws: player1.ws, name: player1.name, mark: 'X' }, { ws: player2.ws, name: player2.name, mark: 'O' }] };
}

function joinQueue(ws, rooms, playerName) {
  queue.push({ ws, name: playerName });
  if (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    const room = createRoom(p1, p2);
    rooms[room.id] = room;

    room.players.forEach(p => {
      p.ws.send(JSON.stringify({ type: 'room', roomId: room.id, mark: p.mark, opponent: room.players.find(o => o !== p).name }));
    });
  }
}

function leaveRoom(ws, rooms) {
  for (const roomId in rooms) {
    const room = rooms[roomId];
    room.players = room.players.filter(p => p.ws !== ws);
    if (room.players.length === 0) delete rooms[roomId];
  }
  queue = queue.filter(p => p.ws !== ws);
}

function getRoomPlayers(roomId, rooms) {
  return rooms[roomId] ? rooms[roomId].players.map(p => p.name) : [];
}

module.exports = { createRoom, joinQueue, leaveRoom, getRoomPlayers };
