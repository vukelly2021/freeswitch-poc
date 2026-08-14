const WebSocket = require("ws");
const fs = require("fs");
const SessionManager =
    require("../sessions/SessionManager");

class VoiceGateway {

    constructor(host, port) {

        this.server = new WebSocket.Server({
            host,
            port
        });

        console.log("=====================================");
        console.log(" TeleIQ Voice Gateway");
        console.log("=====================================");
        console.log(`Listening on ${host}:${port}`);
        console.log("");

        this.server.on("connection", (ws, req) => {

            console.log("New FreeSWITCH connection");
            const uuid = SessionManager.next();

if (!uuid) {

    console.log("No pending session");

    ws.close();

    return;

}

const session = SessionManager.get(uuid);

if (!session) {

    console.log("Session not found");

    ws.close();

    return;

}

session.attachWebSocket(ws);

console.log(`Attached WebSocket to ${uuid}`);
            console.log("Remote:", req.socket.remoteAddress);
           
           let firstPacket = true;

            ws.once("message", (data, isBinary) => {
		    if (!isBinary)
        		return;

		    if (firstPacket) {

        		firstPacket = false;
			console.log("=== FIRST WEBSOCKET FRAME ===");
                        console.log("isBinary:", isBinary);
                        console.log("constructor:", data.constructor.name);
                        console.log("length:", data.length);

                        fs.writeFileSync("/tmp/packet.bin", data);

                        console.log("Saved to /tmp/packet.bin");

    		    }

            });

            ws.on("close", () => {

                console.log("Connection closed");

            });

            ws.on("error", (err) => {

                console.error(err);

            });

        });

    }

}

module.exports = VoiceGateway;
