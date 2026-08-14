const net = require("net");
const SessionManager =
    require("../sessions/SessionManager");

class ESLClient {

    constructor(host, port, password) {

        this.host = host;
        this.port = port;
        this.password = password;

        this.buffer = "";
	SessionManager.setPlaybackHandler(
    (uuid, file) => {

        console.log(
            `🔊 FreeSWITCH playback: ${uuid} ${file}`
        );

        this.send(
            `api uuid_broadcast ${uuid} ${file} aleg`
        );
    }
);

    }

    connect() {

        console.log(
            `Connecting to FreeSWITCH ${this.host}:${this.port}...`
        );

        this.socket = net.createConnection(
            {
                host: this.host,
                port: this.port
            }
        );

        this.socket.setEncoding("utf8");

        this.socket.on("connect", () => {

            console.log("TCP connected");

        });

        this.socket.on("data", (data) => {

            console.log("--------------------------------");
            console.log(data);

            this.handleData(data);

        });

        this.socket.on("close", () => {

            console.log("Disconnected");

        });

        this.socket.on("error", (err) => {

            console.error(err);

        });

    }

    send(command) {

        console.log("SEND >", command);

        this.socket.write(command + "\n\n");

    }

    handleData(data) {

        this.buffer += data;

        //
        // authentication request
        //

        if (this.buffer.includes("Content-Type: auth/request")) {

            this.buffer = "";

            this.send(`auth ${this.password}`);

            return;

        }

        //
        // authenticated
        //

        if (this.buffer.includes("+OK accepted")) {

            this.buffer = "";

            console.log("Authenticated");

            this.send("event plain CHANNEL_ANSWER");

            return;

        }

        //
        // subscribed
        //

        if (this.buffer.includes("event listener enabled")) {

            this.buffer = "";

            console.log("Subscribed to CHANNEL_ANSWER");

            return;

        }

        //
        // answered call
        //

        if (this.buffer.includes("Event-Name: CHANNEL_ANSWER")) {

            const match =
                this.buffer.match(/Unique-ID:\s*(.+)/);

            if (match) {

                const uuid = match[1].trim();
		
		const session =
    		   SessionManager.create(uuid);
		   SessionManager.queue(uuid);

                console.log("");
                console.log("==============================");
                console.log("Incoming Call");
                console.log(uuid);
                console.log("==============================");
                console.log("");

	        this.send(
                    `api uuid_audio_stream ${uuid} start ws://teleiq-voice-gateway:8080 mono 16000`
                );
             }

            this.buffer = "";

        }

    }

}

module.exports = ESLClient;
