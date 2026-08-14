const DeepgramSTT = require("../stt/DeepgramSTT");
const ElevenLabsTTS = require("../tts/ElevenLabsTTS");

class AudioSession {

    constructor(uuid,playAudio) {

        this.uuid = uuid;
	this.playAudio = playAudio;

        this.websocket = null;

        this.connectedAt = new Date();

        this.packetCount = 0;

        this.byteCount = 0;

        this.transcript = [];

	this.stt = new DeepgramSTT(
    (transcript) => {
        this.handleTranscript(transcript);
    }
);

        this.stt.connect();
        this.tts = new ElevenLabsTTS();

        console.log(`AudioSession created: ${uuid}`);

    }

    attachWebSocket(ws) {

        this.websocket = ws;

        console.log(
            `WebSocket attached to ${this.uuid}`
        );

        ws.on("message", (data, isBinary) => {

            this.onAudio(data, isBinary);

        });

        ws.on("close", () => {

            this.onClose();

        });

        ws.on("error", err => {

            console.error(err);

        });

    }
async handleTranscript(transcript) {

    console.log(
        `[${this.uuid}] Deepgram final: "${transcript}"`
    );

    try {

        const responseText =
            `I heard you say ${transcript}`;

        const outputFile =
            `/shared/elevenlabs-${this.uuid}.wav`;

        await this.tts.synthesize(
            responseText,
            outputFile
        );

        console.log(
            `READY TO PLAY: ${outputFile}`
        );
	if (this.playAudio) {

    console.log(
        `[${this.uuid}] Playing ElevenLabs response`
    );

    this.playAudio(
        this.uuid,
        outputFile
    );
}

    } catch (err) {

        console.error(
            "❌ ElevenLabs TTS failed:",
            err
        );

    }
}
    onAudio(buffer, isBinary) {

	console.log("AudioSession.onAudio()");

        if (!isBinary)
            return;

        this.packetCount++;

        this.byteCount += buffer.length;
	const samples = [];

for (let i = 0; i < buffer.length - 1; i += 2) {
    samples.push(buffer.readInt16LE(i));
}

const min = Math.min(...samples);
const max = Math.max(...samples);

let sumSquares = 0;

for (const s of samples) {
    sumSquares += s * s;
}

const rms = Math.sqrt(sumSquares / samples.length);

console.log(
    `AUDIO DEBUG min=${min} max=${max} rms=${rms.toFixed(2)}`
);


	this.stt.sendAudio(buffer);

        // Temporary
        console.log(
            `[${this.uuid}] packet=${this.packetCount} bytes=${buffer.length}`
        );

    }

    onClose() {

        console.log(
            `Call ended ${this.uuid}`
        );

    }

}

module.exports = AudioSession;
