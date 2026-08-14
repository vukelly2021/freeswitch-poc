const fs = require("fs");

class ElevenLabsTTS {

    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.voiceId = process.env.ELEVENLABS_VOICE_ID;

        if (!this.apiKey) {
            throw new Error("ELEVENLABS_API_KEY is not set");
        }

        if (!this.voiceId) {
            throw new Error("ELEVENLABS_VOICE_ID is not set");
        }
    }

    async synthesize(text, outputFile) {

        console.log(`🔊 ElevenLabs TTS: "${text}"`);

        const url =
            `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}` +
            `?output_format=pcm_16000`;

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "xi-api-key": this.apiKey,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: text,
                model_id: "eleven_flash_v2_5"
            })
        });

        if (!response.ok) {
            const error = await response.text();

            throw new Error(
                `ElevenLabs error ${response.status}: ${error}`
            );
        }

        const pcmBuffer =
            Buffer.from(await response.arrayBuffer());

        console.log(
            `ElevenLabs returned ${pcmBuffer.length} PCM bytes`
        );

        this.writeWav(
            outputFile,
            pcmBuffer,
            16000
        );

        console.log(
            `✅ ElevenLabs WAV created: ${outputFile}`
        );

        return outputFile;
    }

    writeWav(filename, pcmData, sampleRate) {

        const header = Buffer.alloc(44);

        header.write("RIFF", 0);
        header.writeUInt32LE(
            36 + pcmData.length,
            4
        );

        header.write("WAVE", 8);
        header.write("fmt ", 12);

        header.writeUInt32LE(16, 16);
        header.writeUInt16LE(1, 20);       // PCM
        header.writeUInt16LE(1, 22);       // mono
        header.writeUInt32LE(sampleRate, 24);

        header.writeUInt32LE(
            sampleRate * 2,
            28
        );

        header.writeUInt16LE(2, 32);
        header.writeUInt16LE(16, 34);

        header.write("data", 36);

        header.writeUInt32LE(
            pcmData.length,
            40
        );

        fs.writeFileSync(
            filename,
            Buffer.concat([header, pcmData])
        );
    }
}

module.exports = ElevenLabsTTS;
