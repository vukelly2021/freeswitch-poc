# TeleIQ WebRTC Client POC

Minimal browser client using SIP.js + WebRTC to register to FreeSWITCH over SIP WebSocket and place an audio-only call into the existing TeleIQ voice pipeline.

## Architecture

```text
Browser (SIP.js + WebRTC)
        |
        | SIP over WS/WSS
        v
FreeSWITCH mod_sofia
        |
        | WebRTC media
        v
FreeSWITCH channel
        |
        | mod_audio_stream
        v
TeleIQ Voice Gateway
        |
        +--> STT --> LLM --> TTS
        |
        v
FreeSWITCH --> Browser
```

## Run

```bash
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## FreeSWITCH prerequisites

The internal Sofia profile should expose SIP WebSocket listeners, commonly:

```xml
<param name="ws-binding" value=":5066"/>
<param name="wss-binding" value=":7443"/>
```

For local POC this client defaults to `ws://127.0.0.1:5066`. For production use HTTPS + WSS with a trusted certificate.

If FreeSWITCH runs in Docker, publish the WebSocket signaling port and your configured RTP range, for example:

```yaml
ports:
  - "5066:5066/tcp"
  - "7443:7443/tcp"
  - "16384-16482:16384-16482/udp"
```

The browser needs a FreeSWITCH directory user for authenticated registration. Enter the actual extension, password and SIP domain in the UI.

The default call destination is `9999`. Change it to the extension/dialplan destination that starts your TeleIQ AI flow.

## Test

1. Start FreeSWITCH.
2. Start `teleiq-voice-gateway`.
3. Run this client with `npm run dev`.
4. Open `http://localhost:5173`.
5. Enter WSS/WS URL, domain, SIP username/password and destination.
6. Click **Connect & Register**.
7. Click **Start Voice** and allow microphone access.
8. Speak `testing one two three`.
9. Confirm FreeSWITCH has a live channel.
10. Confirm the voice gateway logs receive audio and Deepgram returns a transcript.
11. Confirm the browser hears the TTS response.

## Useful FreeSWITCH checks

```bash
docker exec teleiq-freeswitch fs_cli -x "sofia status profile internal reg"
docker exec teleiq-freeswitch fs_cli -x "show channels"
docker exec teleiq-freeswitch fs_cli -x "uuid_dump <UUID>"
```

Record the browser audio inside FreeSWITCH if needed:

```bash
docker exec teleiq-freeswitch fs_cli -x "uuid_record <UUID> start /tmp/webrtc-test.wav"
docker exec teleiq-freeswitch fs_cli -x "uuid_record <UUID> stop /tmp/webrtc-test.wav"
docker cp teleiq-freeswitch:/tmp/webrtc-test.wav .
```

## Troubleshooting

- **WebSocket fails:** verify `ws-binding`/`wss-binding`, Docker port publishing, and browser certificate trust.
- **Registration fails:** verify extension/password/domain and inspect FreeSWITCH auth logs.
- **Mic works but no audio at FreeSWITCH:** inspect ICE candidates, RTP addresses, Docker UDP range and NAT configuration.
- **HTTPS page + ws:// fails:** mixed-content rules require WSS.
- **FreeSWITCH gets audio but Deepgram does not:** debug `mod_audio_stream` / voice gateway, not WebRTC.

## POC success criteria

```text
Browser voice -> FreeSWITCH -> mod_audio_stream -> TeleIQ -> TTS -> FreeSWITCH -> Browser
```

## Production follow-up

- WSS only
- CA-trusted certificate
- TURN support for restrictive NAT/firewalls
- short-lived TeleIQ session credentials instead of reusable SIP passwords
- tenant + conversation metadata
- package the browser layer as an embeddable TeleIQ Voice SDK
