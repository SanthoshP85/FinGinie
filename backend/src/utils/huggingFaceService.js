/**
 * HuggingFace AI Service
 * Integrates HuggingFace models for:
 * - LLM (text generation) - using HuggingFace Router API
 * - Embeddings (vector representations)
 */

const { OpenAI } = require("openai");
const { HfInference } = require("@huggingface/inference");

class HuggingFaceAIService {
  constructor() {
    this.openaiClient = null;
    this.hfInference = null;
    this.hfApiKey = null;
    this.embeddingProvider = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;

    if (!hfToken) {
      throw new Error(
        "HuggingFace API key not found. Set HF_TOKEN or HUGGINGFACE_API_KEY",
      );
    }

    this.hfApiKey = hfToken;

    // Initialize OpenAI client pointing to HuggingFace Router
    this.openaiClient = new OpenAI({
      baseURL: "https://router.huggingface.co/v1",
      apiKey: hfToken,
    });

    // Initialize HF Inference for embeddings
    this.hfInference = new HfInference(hfToken);

    // Set embedding provider
    this.embeddingProvider =
      process.env.EMBEDDING_PROVIDER || "huggingface_api";

    this.isInitialized = true;
    console.log(
      "HuggingFace AI Service initialized with provider:",
      this.embeddingProvider,
    );
  }

  /**
   * Call LLM for text generation using HuggingFace Router API
   */
  async callLLM(userQuery, systemPrompt, options = {}) {
    if (!this.isInitialized) this.initialize();

    const models = [
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "microsoft/DialoGPT-medium",
      "HuggingFaceH4/zephyr-7b-beta",
      "mistralai/Mistral-7B-Instruct-v0.1",
    ];

    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Trying HuggingFace model: ${model}`);

        const chatCompletion = await this.openaiClient.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userQuery,
            },
          ],
          max_tokens: options.maxTokens || 512,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.95,
        });

        console.log(`Successfully used model: ${model}`);
        return chatCompletion.choices[0].message.content;
      } catch (modelError) {
        console.log(`Model ${model} failed:`, modelError.message);
        lastError = modelError;
        continue;
      }
    }

    console.error("All HuggingFace models failed:", lastError?.message);
    throw lastError;
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(texts) {
    if (!this.isInitialized) this.initialize();

    try {
      const input = Array.isArray(texts) ? texts : [texts];

      console.log(
        `Generating embeddings for ${input.length} text(s) using ${this.embeddingProvider}...`,
      );

      const embeddings = await this.hfInference.featureExtraction({
        model:
          process.env.HUGGINGFACE_EMBEDDING_MODEL ||
          "sentence-transformers/all-MiniLM-L6-v2",
        inputs: input,
      });

      if (!Array.isArray(embeddings[0])) {
        return [embeddings];
      }

      return embeddings;
    } catch (error) {
      console.warn(`HuggingFace Inference API failed: ${error.message}`);
      console.log("Falling back to mock embeddings (384-dim)...");

      const input = Array.isArray(texts) ? texts : [texts];
      return input.map((text) => this.generateMockEmbedding(text));
    }
  }

  /**
   * Generate mock embedding (384-dimensional vector)
   */
  generateMockEmbedding(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const embedding = [];
    const dimensions =
      parseInt(process.env.HUGGINGFACE_EMBEDDING_DIMENSIONS) || 384;

    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i;
      const x = Math.sin(seed) * Math.cos(seed + 1);
      const normalized =
        Math.round(Math.max(-1, Math.min(1, x)) * 10000) / 10000;
      embedding.push(normalized);
    }

    return embedding;
  }

  /**
   * Generate embedding for a single query
   */
  async generateQueryEmbedding(query) {
    const embeddings = await this.generateEmbeddings(query);
    return embeddings[0] || embeddings;
  }
}

// Singleton instance
const hfService = new HuggingFaceAIService();

module.exports = hfService;
