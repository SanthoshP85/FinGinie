/**
 * Pinecone Vector Store Service
 * Handles vector embeddings and similarity search
 */

const { Pinecone } = require("@pinecone-database/pinecone");
const hfService = require("./huggingFaceService");

class PineconeVectorStore {
  constructor() {
    this.pinecone = null;
    this.index = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const apiKey = process.env.PINECONE_API_KEY;
      const indexName = process.env.PINECONE_INDEX_NAME;

      if (!apiKey || !indexName) {
        console.warn(
          "Pinecone not configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME",
        );
        return;
      }

      this.pinecone = new Pinecone({
        apiKey: apiKey,
      });

      this.index = this.pinecone.index(indexName);
      this.isInitialized = true;

      console.log("Pinecone Vector Store initialized");
    } catch (error) {
      console.error("Failed to initialize Pinecone:", error.message);
      throw error;
    }
  }

  /**
   * Upsert vector data to Pinecone
   */
  async upsertVector(id, text, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.index) {
      console.warn("Pinecone not available, skipping vector store");
      return null;
    }

    try {
      const embedding = await hfService.generateQueryEmbedding(text);

      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error(
          `Invalid embedding: expected non-empty array, got ${JSON.stringify(embedding)}`,
        );
      }

      await this.index.upsert([
        {
          id: id,
          values: embedding,
          metadata: {
            text: text.substring(0, 1000),
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        },
      ]);

      console.log(`Vector stored in Pinecone: ${id}`);
      return id;
    } catch (error) {
      console.error(`Failed to upsert vector to Pinecone: ${error.message}`);
      return null;
    }
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(query, topK = 5, filter = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.index) {
      console.warn("Pinecone not available, skipping search");
      return [];
    }

    try {
      const queryEmbedding = await hfService.generateQueryEmbedding(query);

      const queryOptions = {
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
      };

      if (Object.keys(filter).length > 0) {
        queryOptions.filter = filter;
      }

      const results = await this.index.query(queryOptions);

      return results.matches.map((match) => ({
        id: match.id,
        score: match.score,
        text: match.metadata?.text || "",
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error(`Failed to search Pinecone: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete vector from Pinecone
   */
  async deleteVector(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.index) {
      console.warn("Pinecone not available, skipping delete");
      return null;
    }

    try {
      await this.index.deleteOne(id);
      console.log(`Vector deleted from Pinecone: ${id}`);
      return id;
    } catch (error) {
      console.error(`Failed to delete vector from Pinecone: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete vectors by filter
   */
  async deleteByFilter(filter) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.index) {
      console.warn("Pinecone not available, skipping delete");
      return null;
    }

    try {
      await this.index.deleteMany(filter);
      console.log("Vectors deleted from Pinecone by filter");
    } catch (error) {
      console.error(`Failed to delete vectors from Pinecone: ${error.message}`);
      throw error;
    }
  }
}

// Singleton instance
let instance = null;

const getPineconeService = () => {
  if (!instance) {
    instance = new PineconeVectorStore();
  }
  return instance;
};

module.exports = {
  PineconeVectorStore,
  getPineconeService,
};
