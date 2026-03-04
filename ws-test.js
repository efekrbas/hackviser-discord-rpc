const WebSocket = require('ws');
console.log("Starting mock Discord RPC server on 6463");
const wss = new WebSocket.Server({ port: 6463 });
wss.on('connection', function connection(ws, req) {
    console.log("=== NEW CONNECTION ===");
    console.log("Headers:", req.headers);
    ws.close();
});
