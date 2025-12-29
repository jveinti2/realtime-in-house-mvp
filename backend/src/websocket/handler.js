import sttService from "../services/stt.js";
import llmService from "../services/llm.js";
import ttsService from "../services/tts.js";

let sttInitialized = false;
let llmInitialized = false;
let ttsInitialized = false;
const clients = new Set();

let userSpeechBuffer = "";
let silenceTimeout = null;
const SILENCE_DURATION = 1000;

let llmTokenBuffer = "";
let llmTokenCount = 0;
const TOKEN_BUFFER_SIZE = 10;

let pipelineConfig = {
  stt: true,
  llm: true,
  tts: true,
};

const initializeSTT = async () => {
  if (sttInitialized) return;

  await sttService.initialize();

  if (!llmInitialized) {
    await llmService.initialize();
    llmInitialized = true;
  }

  if (!ttsInitialized) {
    await ttsService.initialize();
    ttsInitialized = true;
  }

  sttService.onTranscription(async (data) => {
    if (data.type === "done") {
      if (userSpeechBuffer) {
        userSpeechBuffer += " " + data.text;
      } else {
        userSpeechBuffer = data.text;
      }

      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }

      silenceTimeout = setTimeout(async () => {
        const finalText = userSpeechBuffer;
        userSpeechBuffer = "";

        clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(
              JSON.stringify({
                type: "transcript_done",
                text: finalText,
                timestamp: Date.now(),
              })
            );
          }
        });

        if (!pipelineConfig.llm) {
          // console.log("[DEBUG] LLM deshabilitado, saltando generación de respuesta");
          return;
        }

        try {
          llmTokenBuffer = "";
          llmTokenCount = 0;

          for await (const token of llmService.generateStream(finalText)) {
            clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(
                  JSON.stringify({
                    type: "llm_token",
                    token: token,
                    timestamp: Date.now(),
                  })
                );
              }
            });

            llmTokenBuffer += token;
            llmTokenCount++;

            if (llmTokenCount >= TOKEN_BUFFER_SIZE && pipelineConfig.tts) {
              await processTextToSpeech(llmTokenBuffer);
              llmTokenBuffer = "";
              llmTokenCount = 0;
            } else if (!pipelineConfig.tts) {
              llmTokenBuffer = "";
              llmTokenCount = 0;
            }
          }

          if (llmTokenBuffer && pipelineConfig.tts) {
            await processTextToSpeech(llmTokenBuffer);
          }

          clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(
                JSON.stringify({
                  type: "llm_done",
                  timestamp: Date.now(),
                })
              );
            }
          });
        } catch (error) {
          console.error("Error procesando LLM:", error);
        }
      }, SILENCE_DURATION);
    }
  });

  sttInitialized = true;
};

async function processTextToSpeech(text) {
  try {
    for await (const audioChunk of ttsService.synthesizeStream(text)) {
      clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(audioChunk);
        }
      });
    }
  } catch (error) {
    console.error("Error en TTS:", error);
  }
}

export async function handleConnection(ws, req) {
  const clientId = Math.random().toString(36).substring(7);
  console.log(
    `Cliente ${clientId} conectado desde ${req.socket.remoteAddress}`
  );

  clients.add(ws);

  try {
    await initializeSTT();
  } catch (error) {
    console.error("Error inicializando STT Service:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "No se pudo inicializar el servicio de transcripción",
      })
    );
    return;
  }

  ws.on("message", async (data, isBinary) => {
    try {
      if (isBinary) {
        if (pipelineConfig.stt) {
          await sttService.transcribeChunk(data);
        } else {
          console.log("[DEBUG] STT deshabilitado, ignorando chunk de audio");
        }
      } else {
        const message = JSON.parse(data.toString());
        console.log(`[${clientId}] Mensaje recibido:`, message);

        if (message.type === "toggle_component") {
          const { component, enabled } = message;
          pipelineConfig[component] = enabled;

          console.log(
            `[CONFIG] ${component.toUpperCase()} ${
              enabled ? "habilitado" : "deshabilitado"
            }`
          );

          ws.send(
            JSON.stringify({
              type: "config_updated",
              stt: pipelineConfig.stt,
              llm: pipelineConfig.llm,
              tts: pipelineConfig.tts,
              timestamp: Date.now(),
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "ack",
              message: "Mensaje recibido",
              timestamp: Date.now(),
            })
          );
        }
      }
    } catch (error) {
      console.error(`[${clientId}] Error procesando mensaje:`, error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error.message,
        })
      );
    }
  });

  ws.on("close", async () => {
    console.log(`Cliente ${clientId} desconectado`);
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error(`[${clientId}] Error en conexión:`, error);
  });

  ws.send(
    JSON.stringify({
      type: "connected",
      clientId,
      message: "Conexión establecida exitosamente",
    })
  );
}
