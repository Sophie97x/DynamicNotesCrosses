const {test,before,after,afterEach}=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),WebSocket=require('ws'),{server}=require('../src/server');
let url;const clients=new Set();
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');url=`ws://127.0.0.1:${server.address().port}/ws`;});
afterEach(async()=>{for(const ws of clients)ws.terminate();clients.clear();await new Promise(r=>setImmediate(r));});
after(async()=>{await new Promise(r=>server.close(r));});
async function connect(){const ws=new WebSocket(url);clients.add(ws);const messages=[],waits=[];
 ws.on('message',raw=>{const m=JSON.parse(raw),i=waits.findIndex(w=>w.type===m.type);if(i<0)messages.push(m);else waits.splice(i,1)[0].resolve(m);});
 ws.next=type=>{const i=messages.findIndex(m=>m.type===type);if(i>=0)return Promise.resolve(messages.splice(i,1)[0]);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(`No ${type}`)),2000);waits.push({type,resolve:m=>{clearTimeout(timer);resolve(m);}});});};
 ws.clear=type=>{for(let i=messages.length-1;i>=0;i--)if(messages[i].type===type)messages.splice(i,1);};
 await once(ws,'open');await ws.next('stats');return ws;}
function send(ws,data){ws.send(JSON.stringify(data));}
test('malformed and non-object messages cannot crash service',async()=>{const ws=await connect();for(const raw of ['{','null','[]','42','"move"'])ws.send(raw);send(ws,{type:'getStats'});assert.equal((await ws.next('stats')).playersOnline,1);});
test('oversized message closes only its connection',async()=>{const ws=await connect(),closed=once(ws,'close');ws.send('x'.repeat(17000));assert.equal((await closed)[0],1009);const healthy=await connect();send(healthy,{type:'getStats'});assert.ok((await healthy.next('stats')).playersOnline>=1);});
test('membership and numeric position checks preserve legitimate turns',async()=>{
 const x=await connect(),o=await connect(),outsider=await connect();send(x,{type:'createRoom'});const {roomCode}=await x.next('roomCreated');send(o,{type:'join',roomCode});await x.next('matched');await o.next('matched');
 send(x,{type:'move',roomCode,position:0});await x.next('gameState');await o.next('gameState');send(outsider,{type:'move',roomCode,position:1});await outsider.next('invalidMove');
 send(o,{type:'move',roomCode,position:1});const normal=await x.next('gameState');await o.next('gameState');assert.deepEqual(normal.board,['X','O',null,null,null,null,null,null,null]);
 for(const position of ['__proto__','constructor','1',-1,9,0.5,null,{}]){send(x,{type:'move',roomCode,position});await x.next('invalidMove');}
 send(x,{type:'move',roomCode,position:2});const state=await x.next('gameState');await o.next('gameState');assert.equal(state.board[2],'X');assert.equal(state.currentTurn,'O');
});
test('chat uses text nodes even for HTML-shaped messages',()=>{
 const nodes=new Map(),make=()=>({children:[],events:{},value:'',addEventListener(n,f){this.events[n]=f;},appendChild(n){this.children.push(n);},set innerHTML(_){throw Error('HTML parser forbidden');}});
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);},createElement(){return make();}};let connection;class MockSocket{constructor(){connection=this;}static OPEN=1;}
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../frontend/js/socket.js'),'utf8'),{document,WebSocket:MockSocket,window:{location:{origin:'https://game.example'}},console});nodes.get('connectBtn').events.click();
 for(const text of ['<img src=x onerror=alert(1)>','Hello & goodbye'])connection.onmessage({data:JSON.stringify({type:'message',text})});assert.deepEqual(nodes.get('output').children.map(n=>n.textContent),['<img src=x onerror=alert(1)>','Hello & goodbye']);connection.onmessage({data:'{'});
});
test('legacy move handler rejects prototype keys and invalid positions',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../frontend/index.html'),'utf8'),match=html.match(/function handleOpponentMove\(position\) \{[\s\S]*?\r?\n\}/);assert.ok(match);const cells=Array.from({length:9},()=>({classList:{contains:()=>true}}));
 for(const position of ['__proto__','constructor','1',-1,9,0.5,{},null]){const board=Array(9).fill(null);vm.runInNewContext(match[0]+';handleOpponentMove(position)',{position,cells,board});assert.deepEqual(board,Array(9).fill(null));assert.equal(Object.getPrototypeOf(board),Array.prototype);}
 const board=Array(9).fill(null),state={position:0,cells,board,currentTurn:'X',roomInfo:{},turnIndicator:{},roomCode:'ROOM',playerMark:'O',placeMark(){},checkWin(){}};vm.runInNewContext(match[0]+';handleOpponentMove(position)',state);assert.equal(board[0],'X');assert.equal(state.currentTurn,'O');
});
for(const transition of ['create','join'])test(`moving from queue to ${transition} room removes matchmaking membership`,async()=>{
 const host=await connect(),a=await connect(),b=await connect();let roomCode;
 if(transition==='join'){send(host,{type:'createRoom'});roomCode=(await host.next('roomCreated')).roomCode;}
 send(a,{type:'queue'});await a.next('queue');
 if(transition==='create'){send(a,{type:'createRoom'});roomCode=(await a.next('roomCreated')).roomCode;}
 else{send(a,{type:'join',roomCode});await a.next('matched');await host.next('matched');}
 send(b,{type:'queue'});await b.next('queue');
 // A reply barrier drains preceding broadcasts before asking for fresh stats.
 send(b,{type:'getRooms'});await b.next('availableRooms');b.clear('stats');
 send(b,{type:'getStats'});assert.equal((await b.next('stats')).playersInQueue,1);
});
