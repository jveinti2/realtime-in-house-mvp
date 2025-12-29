import OpenAI from "openai";
import { BaseLLMAdapter } from "./base.js";

export class OpenAIGPT4Adapter extends BaseLLMAdapter {
  constructor(config = {}) {
    super(config);
    this.openai = new OpenAI({ apiKey: process.env.LLM_OPENAI_API_KEY });
    this.model = "gpt-4o-mini";
  }

  async initialize() {
    this.isInitialized = true;
  }

  async *generateStream(prompt) {
    const stream = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente de TIGO útil que responde en español a cualquier problema que tenga el usuario para su servicio de internet",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
      max_completion_tokens: 250,
      temperature: 0.2,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  }

  async close() {
    this.isInitialized = false;
  }
}
