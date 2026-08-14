const WebSocket = require("ws");
const fs = require("fs");


class DeepgramSTT {

    constructor(onFinalTranscript) {

        this.ws = null;
	this.dump = fs.createWriteStream("/tmp/audio.raw");
	this.onFinalTranscript = onFinalTranscript;

    }

    connect() {

        console.log("Connecting to Deepgram...");


        this.ws = new WebSocket(
    "wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=nova-3&interim_results=true",
 

            {
                headers: {
                    Authorization:
                        `Token ${process.env.DEEPGRAM_API_KEY}`
                }
            }

        );

        this.ws.on("open", () => {

            console.log("✅ Deepgram Connected");

        });
	this.ws.on("upgrade", (res) => {
        console.log("Deepgram WebSocket upgraded");
        console.log(res.headers);
    });


this.ws.on("message", (data) => {

    try {

        const msg = JSON.parse(data.toString());

        // Only process final speech
        if (
            msg.type === "Results" &&
            msg.is_final === true &&
            msg.speech_final === true
        ) {

            const transcript =
                msg.channel?.alternatives?.[0]?.transcript?.trim();

            if (transcript) {

                console.log(
                    "===================================="
                );
                console.log(
                    "🎤 FINAL TRANSCRIPT:",
                    transcript
                );
                console.log(
                    "===================================="
                );

                if (this.onFinalTranscript) {
                    this.onFinalTranscript(transcript);
                }
            }
        }

    } catch (err) {

        console.error(
            "Deepgram message parse error:",
            err
        );

    }

});
	   this.ws.on("close", () => {
            console.log("Deepgram Closed");
        });

        this.ws.on("error", (err) => {
            console.error(err);
        });

	this.ws.on("unexpected-response", (req, res) => {
    console.log("UNEXPECTED RESPONSE");
    console.log("Status:", res.statusCode);
});

    }   // <-- connect() ENDS HERE
    sendAudio(buffer) {

    if (!this.ws) {
        console.log("No WebSocket");
        return;
    }

    console.log("Deepgram readyState =", this.ws.readyState);

    if (this.ws.readyState !== WebSocket.OPEN) {
        console.log("Deepgram not open");
        return;
    }

    const fs = require("fs");


    if (this.ws.readyState === WebSocket.OPEN) {

        // Save exactly what we're sending
        fs.appendFileSync(
            `/tmp/deepgram.raw`,
	   buffer 
        );

        this.ws.send(buffer);
    }

}
    close() {

        if (this.ws)
            this.ws.close();

    }



}

module.exports = DeepgramSTT;
