const AudioSession = require("./AudioSession");

class SessionManager {

    constructor() {

        this.sessions = new Map();
	this.pending = [];
	this.playAudio = null;

    }
    queue(uuid) {

    this.pending.push(uuid);

    }
   setPlaybackHandler(handler) {
    this.playAudio = handler;
}

   next() {

    return this.pending.shift();

    } 

    create(uuid) {

        let session =
            this.sessions.get(uuid);

        if (session)
            return session;

        session =
          new AudioSession(
            uuid,
            this.playAudio
          );
        this.sessions.set(uuid, session);

        return session;

    }

    get(uuid) {

        return this.sessions.get(uuid);

    }

    remove(uuid) {

        this.sessions.delete(uuid);

    }

    count() {

        return this.sessions.size;

    }

}

module.exports =
    new SessionManager();
