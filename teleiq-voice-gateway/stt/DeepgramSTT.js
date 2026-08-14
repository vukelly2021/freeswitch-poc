const WebSocket = require("ws");

class DeepgramSTT {

    connect() {

        this.ws = new WebSocket(
            "wss://api.deepgram.com/v1/listen?...",
            {
                headers: {
                    Authorization:
                        `Token ${process.env.DEEPGRAM_API_KEY}`
                }
            }
        );

    }

}
