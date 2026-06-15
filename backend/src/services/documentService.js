/**
 * Document Service
 * Handles document upload, processing, and vectorization
 */

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const pdfParse = require("pdf-parse");
const Document = require("../models/Document");
const { getPineconeService } = require("../utils/pineconeService");

/**
 * Extract text from PDF buffer or file
 */
const extractTextFromPDF = async (bufferOrPath) => {
  try {
    const dataBuffer = Buffer.isBuffer(bufferOrPath) 
      ? bufferOrPath 
      : fs.readFileSync(bufferOrPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF extraction error:", error.message);
    throw new Error("Failed to extract text from PDF");
  }
};

/**
 * Extract text from file/buffer based on type
 */
const extractText = async (bufferOrPath, mimeType) => {
  if (mimeType === "application/pdf") {
    return await extractTextFromPDF(bufferOrPath);
  } else if (mimeType === "text/plain") {
    if (Buffer.isBuffer(bufferOrPath)) {
      return bufferOrPath.toString("utf-8");
    }
    return fs.readFileSync(bufferOrPath, "utf-8");
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
};

/**
 * Split text into chunks for vectorization
 */
const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      // Keep overlap
      const words = currentChunk.split(" ");
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(" ") + " ";
    }
    currentChunk += sentence + " ";
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Process and vectorize document
 */
const processDocument = async (document, bufferOrPath, isBuffer = false) => {
  try {
    // Extract text
    const extractedText = await extractText(bufferOrPath, document.mimeType);

    // Chunk text
    const chunks = chunkText(extractedText);

    // Vectorize chunks
    const pinecone = getPineconeService();
    const vectorIds = [];

    for (let i = 0; i < chunks.length; i++) {
      const vectorId = `${document._id}-chunk-${i}`;
      await pinecone.upsertVector(vectorId, chunks[i], {
        documentId: document._id.toString(),
        userId: document.userId.toString(),
        filename: document.originalName,
        category: document.category,
        chunkIndex: i,
      });
      vectorIds.push(vectorId);
    }

    // Update document
    document.extractedText = extractedText.substring(0, 5000); // Store first 5000 chars
    document.vectorIds = vectorIds;
    document.isProcessed = true;
    await document.save();

    // Clean up uploaded file (only if using disk storage)
    if (!isBuffer && typeof bufferOrPath === 'string' && fs.existsSync(bufferOrPath)) {
      fs.unlinkSync(bufferOrPath);
    }

    return document;
  } catch (error) {
    document.processingError = error.message;
    await document.save();
    throw error;
  }
};

/**
 * Upload and process document
 */
const uploadDocument = async (userId, file, category = "other") => {
  try {
    // Determine if using memory storage (buffer) or disk storage (path)
    const isBuffer = !!file.buffer;
    const filename = file.filename || `document-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    
    // Create document record
    const document = new Document({
      userId,
      filename: filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      category,
    });

    await document.save();

    // Process document with buffer or path
    const bufferOrPath = isBuffer ? file.buffer : file.path;
    processDocument(document, bufferOrPath, isBuffer).catch((error) => {
      console.error("Document processing failed:", error.message);
    });

    return document;
  } catch (error) {
    console.error("Upload document error:", error);
    throw error;
  }
};

/**
 * Get user documents
 */
const getUserDocuments = async (userId) => {
  try {
    const documents = await Document.find({ userId })
      .sort({ createdAt: -1 })
      .select("-extractedText");

    return documents;
  } catch (error) {
    console.error("Get documents error:", error);
    throw error;
  }
};

/**
 * Delete document
 */
const deleteDocument = async (userId, documentId) => {
  try {
    const document = await Document.findOne({ _id: documentId, userId });

    if (!document) {
      return false;
    }

    // Delete vectors from Pinecone
    if (document.vectorIds && document.vectorIds.length > 0) {
      const pinecone = getPineconeService();
      for (const vectorId of document.vectorIds) {
        await pinecone.deleteVector(vectorId);
      }
    }

    // Delete document
    await Document.deleteOne({ _id: documentId });

    return true;
  } catch (error) {
    console.error("Delete document error:", error);
    throw error;
  }
};

module.exports = {
  uploadDocument,
  getUserDocuments,
  deleteDocument,
  processDocument,
};
