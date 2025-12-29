import OpenAI from "openai";
import { BaseSTTAdapter } from "./base.js";
import { Readable } from "stream";

function createWAVBuffer(pcmData, sampleRate, channels, bitsPerSample) {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}

export class OpenAIRealtimeAdapter extends BaseSTTAdapter {
  constructor(config = {}) {
    super(config);
    this.openai = new OpenAI({ apiKey: process.env.STT_OPENAI_API_KEY });
    this.model = "gpt-4o-mini-transcribe";
    this.transcriptionCallbacks = [];
    this.audioBuffer = [];
    this.interval = null;
  }

  async initialize() {
    this.isInitialized = true;
  }

  onTranscription(callback) {
    this.transcriptionCallbacks.push(callback);
  }

  notifyTranscription(data) {
    this.transcriptionCallbacks.forEach((cb) => cb(data));
  }

  async transcribeChunk(audioBuffer) {
    this.audioBuffer.push(Buffer.from(audioBuffer));

    if (!this.interval) {
      this.interval = setInterval(async () => {
        if (this.audioBuffer.length === 0) return;

        const combined = Buffer.concat(this.audioBuffer);
        this.audioBuffer = [];

        const wavBuffer = createWAVBuffer(combined, 16000, 1, 16);

        const stream = Readable.from(wavBuffer);
        stream.path = "audio.wav";

        const transcriptionStream =
          await this.openai.audio.transcriptions.create({
            file: stream,
            model: this.model,
            response_format: "json",
            stream: true,
            chunking_strategy: "auto",
          });

        for await (const event of transcriptionStream) {
          if (event.type === "transcript.text.done" && event.text) {
            this.notifyTranscription({ type: "done", text: event.text });
          }
        }
      }, 500);
    }
  }

  async close() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isInitialized = false;
  }
}
