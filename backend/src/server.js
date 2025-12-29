import express from "express";
import { WebSocketServer } from "ws";
import { handleConnection } from "./websocket/handler.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env") });

const app = express();
const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  console.log("Nueva conexión WebSocket establecida");
  handleConnection(ws, req);
});

wss.on("error", (error) => {
  console.error("Error en WebSocket Server:", error);
});

console.log(`WebSocket Server listo en ws://localhost:${PORT}`);
