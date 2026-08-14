const config = require("./config");

const VoiceGateway = require("./websocket/server");
const ESLClient = require("./esl/client");

new VoiceGateway(
    config.websocket.host,
    config.websocket.port
);

const esl = new ESLClient(
    config.esl.host,
    config.esl.port,
    config.esl.password
);
console.log(
    "Deepgram Key:",
    process.env.DEEPGRAM_API_KEY ?
        "Loaded" :
        "Missing"
);
esl.connect();
