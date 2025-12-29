import { AccessToken } from "livekit-server-sdk";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

app.get("/token", async (req, res) => {
  const roomName = req.query.room || "voice-room";
  const participantName =
    req.query.name || `user-${Math.random().toString(36).substring(7)}`;

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
    }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();

  res.json({
    token: jwt,
    url: process.env.LIVEKIT_URL,
    room: roomName,
    identity: participantName,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Token server corriendo en http://localhost:${PORT}`);
  console.log(`GET /token?room=voice-room&name=user1`);
});
