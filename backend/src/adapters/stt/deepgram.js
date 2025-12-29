import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { BaseSTTAdapter } from "./base.js";

export class DeepgramAdapter extends BaseSTTAdapter {
  constructor(config = {}) {
    super(config);
    this.deepgram = null;
    this.connection = null;
    this.transcriptionCallbacks = [];
    this.isConnected = false;
  }

  async initialize() {
    this.deepgram = createClient(process.env.STT_DEEPGRAM_API_KEY);

    this.connection = this.deepgram.listen.live({
      model: "nova-2",
      language: "es",
      encoding: "linear16",
      sample_rate: 16000,
      channels: 1,
      interim_results: true,
      vad_events: true,
      smart_format: true,
      utterance_end_ms: 1000,
    });

    this.setupEventListeners();

    this.isInitialized = true;
  }

  setupEventListeners() {
    this.connection.on(LiveTranscriptionEvents.Open, () => {
      console.log("✅ Deepgram WebSocket conectado");
      this.isConnected = true;
    });

    this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      const isFinal = data.is_final;

      if (transcript) {
        if (!isFinal) {
          this.notifyTranscription({
            type: "partial",
            text: transcript,
            isFinal: false,
          });
        } else {
          this.notifyTranscription({
            type: "done",
            text: transcript,
            confidence: data.channel?.alternatives?.[0]?.confidence,
            isFinal: true,
          });
        }
      }
    });

    this.connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
      console.log("🎤 [Deepgram VAD] Speech Started");
    });

    this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      console.log("⏸️  [Deepgram VAD] Utterance End");
    });

    this.connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error("❌ [Deepgram] Error:", error);
    });

    this.connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("🔌 Deepgram WebSocket cerrado");
      this.isConnected = false;
    });
  }

  onTranscription(callback) {
    this.transcriptionCallbacks.push(callback);
  }

  notifyTranscription(data) {
    this.transcriptionCallbacks.forEach((cb) => cb(data));
  }

  async transcribeChunk(audioBuffer) {
    if (!this.isConnected) {
      console.warn("⚠️  Deepgram no conectado, ignorando chunk");
      return;
    }

    this.connection.send(audioBuffer);
  }

  async close() {
    if (this.connection) {
      this.connection.finish();
      this.connection = null;
    }
    this.isConnected = false;
    this.isInitialized = false;
    console.log("🔌 DeepgramAdapter cerrado");
  }
}
