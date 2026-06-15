/**
 * Chat Service
 * AI-powered financial assistant using RAG
 */

const { callLLM } = require("../utils/llmService");
const { getPineconeService } = require("../utils/pineconeService");
const ChatSession = require("../models/ChatSession");
const User = require("../models/User");
const Goal = require("../models/Goal");

/**
 * Response configuration
 */
const RESPONSE_CONFIG = {
  maxContextItems: 5,
};

/**
 * Build system prompt for financial assistant
 */
const buildSystemPrompt = (
  userProfile,
  goals = [],
  ragContext = [],
  chatHistory = [],
) => {
  let contextText = "";
  if (ragContext.length > 0) {
    contextText = `\n\nRELEVANT CONTEXT FROM DOCUMENTS:\n${ragContext.map((c) => c.text).join("\n\n")}`;
  }

  let goalsText = "";
  if (goals.length > 0) {
    goalsText = `\n\nUSER'S FINANCIAL GOALS:\n${goals
      .map(
        (g) =>
          `- ${g.title} (${g.category}): Target ${g.currency} ${g.targetAmount}, Current ${g.currency} ${g.currentAmount} (${g.progressPercentage}% complete), Priority: ${g.priority}`,
      )
      .join("\n")}`;
  }

  let historyText = "";
  if (chatHistory.length > 0) {
    historyText = `\n\nRECENT CONVERSATION HISTORY:\n${chatHistory
      .map(
        (msg) => `${msg.role === "user" ? "User" : "FinGinie"}: ${msg.content}`,
      )
      .join("\n")}`;
  }

  const profile = userProfile?.financialProfile || {};

  return `You are FinGinie, a professional AI financial assistant for Indian users.

STRICT RESPONSE RULES:
- Reply in 8-10 clear sentences
- Be professional but friendly
- Give specific, actionable advice when possible
- Reference the user's specific goals when relevant
- Always use Indian Rupees (INR / Rs.) for all monetary values
- Never recommend specific stocks or guarantee returns
- Always suggest consulting a professional for major decisions
- Use the user's data and goals when available
- Consider the recent conversation history for context

USER PROFILE:
- Name: ${userProfile?.fullName || "User"}
- Monthly Income: Rs. ${profile.monthlyIncome || "Not set"}
- Monthly Expenses: Rs. ${profile.monthlyExpenses || "Not set"}
- Savings Goal: Rs. ${profile.savingsGoal || "Not set"}
- Risk Tolerance: ${profile.riskTolerance || "moderate"}
- Investment Horizon: ${profile.investmentHorizon || "medium"}
${goalsText}
${historyText}
${contextText}

Respond helpfully and professionally in Indian Rupees (INR), referencing the user's specific goals and conversation history when applicable.`;
};

/**
 * Retrieve relevant context from vector store
 */
const retrieveContext = async (userId, query, topK = 3) => {
  try {
    const pinecone = getPineconeService();
    const results = await pinecone.searchSimilar(query, topK, {
      userId: userId.toString(),
    });
    return results;
  } catch (error) {
    console.error("Failed to retrieve context:", error.message);
    return [];
  }
};

/**
 * Format response (clean up markdown)
 */
const formatResponse = (response) => {
  if (!response) return response;

  let formatted = response.trim();

  // Remove markdown formatting
  formatted = formatted
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`/g, "")
    .trim();

  return formatted;
};

/**
 * Get recent chat history for context
 */
const getRecentChatHistory = async (userId, sessionId = null, limit = 5) => {
  try {
    let messages = [];

    if (sessionId) {
      // Get messages from current session
      const session = await ChatSession.findById(sessionId);
      if (session && session.messages) {
        // Get last 'limit' message pairs (user + assistant)
        const allMessages = session.messages.slice(-(limit * 2));
        messages = allMessages;
      }
    }

    // If no session messages, get from recent sessions
    if (messages.length === 0) {
      const recentSessions = await ChatSession.find({ userId, isActive: true })
        .sort({ updatedAt: -1 })
        .limit(2);

      for (const session of recentSessions) {
        if (session.messages && session.messages.length > 0) {
          messages = messages.concat(session.messages.slice(-limit));
          if (messages.length >= limit * 2) break;
        }
      }
      messages = messages.slice(-(limit * 2));
    }

    return messages;
  } catch (error) {
    console.error("Failed to get chat history:", error.message);
    return [];
  }
};

/**
 * Get chatbot response
 */
const getChatResponse = async (userId, message, sessionId = null) => {
  try {
    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's active goals
    const goals = await Goal.find({ userId, status: "active" });

    // Get recent chat history (last 5 exchanges)
    const chatHistory = await getRecentChatHistory(userId, sessionId, 5);

    // Retrieve relevant context from documents and goals
    const ragContext = await retrieveContext(userId, message);

    // Build system prompt with goals and chat history
    const systemPrompt = buildSystemPrompt(
      user,
      goals,
      ragContext,
      chatHistory,
    );

    // Call LLM
    const response = await callLLM(message, systemPrompt);

    // Format response
    const formattedResponse = formatResponse(response);

    // Save to chat session
    let session;
    if (sessionId) {
      session = await ChatSession.findById(sessionId);
    }

    if (!session) {
      session = new ChatSession({
        userId,
        title: message.substring(0, 50),
      });
    }

    session.messages.push(
      { role: "user", content: message },
      { role: "assistant", content: formattedResponse },
    );

    await session.save();

    return {
      response: formattedResponse,
      sessionId: session._id,
      contextUsed: ragContext.length > 0,
      goalsUsed: goals.length,
      historyUsed: chatHistory.length,
    };
  } catch (error) {
    console.error("Chat service error:", error);
    throw error;
  }
};

/**
 * Get chat history
 */
const getChatHistory = async (userId, sessionId = null) => {
  try {
    if (sessionId) {
      const session = await ChatSession.findOne({
        _id: sessionId,
        userId,
      });
      return session ? [session] : [];
    }

    const sessions = await ChatSession.find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(10);

    return sessions;
  } catch (error) {
    console.error("Failed to get chat history:", error);
    throw error;
  }
};

/**
 * Delete chat session
 */
const deleteChatSession = async (userId, sessionId) => {
  try {
    const result = await ChatSession.findOneAndDelete({
      _id: sessionId,
      userId,
    });
    return result !== null;
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    throw error;
  }
};

/**
 * Create a new chat session
 */
const createNewSession = async (userId, title = "New Conversation") => {
  try {
    const session = new ChatSession({
      userId,
      title,
      messages: [],
      isActive: true,
    });
    await session.save();
    return session;
  } catch (error) {
    console.error("Failed to create session:", error);
    throw error;
  }
};

/**
 * Get all sessions for a user (for sidebar)
 */
const getAllSessions = async (userId) => {
  try {
    const sessions = await ChatSession.find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .select("_id title updatedAt messages")
      .limit(20);

    return sessions.map((s) => ({
      _id: s._id,
      title: s.title,
      updatedAt: s.updatedAt,
      messageCount: s.messages?.length || 0,
    }));
  } catch (error) {
    console.error("Failed to get sessions:", error);
    throw error;
  }
};

/**
 * Get all messages for a specific session
 */
const getSessionMessages = async (userId, sessionId) => {
  try {
    const session = await ChatSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return null;
    }

    return {
      _id: session._id,
      title: session.title,
      messages: session.messages || [],
      updatedAt: session.updatedAt,
    };
  } catch (error) {
    console.error("Failed to get session messages:", error);
    throw error;
  }
};

module.exports = {
  getChatResponse,
  getChatHistory,
  deleteChatSession,
  createNewSession,
  getAllSessions,
  getSessionMessages,
};
