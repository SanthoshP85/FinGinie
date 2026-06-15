/**
 * Chat Routes
 */

const express = require("express");
const authMiddleware = require("../middleware/auth");
const {
  getChatResponse,
  getChatHistory,
  deleteChatSession,
  createNewSession,
  getAllSessions,
  getSessionMessages,
} = require("../services/chatService");
const { successResponse, errorResponse } = require("../utils/response");

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

/**
 * POST /api/chat/message
 * Send message to AI assistant
 */
router.post("/message", async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim().length === 0) {
      return errorResponse(res, 400, "Message is required");
    }

    const result = await getChatResponse(req.userId, message.trim(), sessionId);

    return successResponse(res, 200, "Response generated", {
      userMessage: message,
      assistantResponse: result.response,
      sessionId: result.sessionId,
      contextUsed: result.contextUsed,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
router.post("/sessions", async (req, res, next) => {
  try {
    const { title } = req.body;
    const session = await createNewSession(req.userId, title);

    return successResponse(res, 201, "Session created", {
      session: {
        id: session._id,
        title: session.title,
        updatedAt: session.updatedAt,
        messageCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/sessions
 * Get all chat sessions for sidebar
 */
router.get("/sessions", async (req, res, next) => {
  try {
    const sessions = await getAllSessions(req.userId);

    return successResponse(res, 200, "Sessions retrieved", { sessions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/sessions/:sessionId/messages
 * Get all messages for a specific session
 */
router.get("/sessions/:sessionId/messages", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionMessages(req.userId, sessionId);

    if (!session) {
      return errorResponse(res, 404, "Session not found");
    }

    return successResponse(res, 200, "Messages retrieved", { session });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/history
 * Get chat history (legacy)
 */
router.get("/history", async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const sessions = await getChatHistory(req.userId, sessionId);

    return successResponse(res, 200, "Chat history retrieved", { sessions });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/chat/sessions/:sessionId
 * Delete chat session
 */
router.delete("/sessions/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleted = await deleteChatSession(req.userId, sessionId);

    if (!deleted) {
      return errorResponse(res, 404, "Session not found");
    }

    return successResponse(res, 200, "Session deleted");
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/chat/session/:sessionId
 * Delete chat session (legacy route)
 */
router.delete("/session/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleted = await deleteChatSession(req.userId, sessionId);

    if (!deleted) {
      return errorResponse(res, 404, "Session not found");
    }

    return successResponse(res, 200, "Session deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
