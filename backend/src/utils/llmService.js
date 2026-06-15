/**
 * LLM Service
 * Centralized LLM calling logic with fallbacks
 */

const axios = require("axios");
const hfService = require("./huggingFaceService");

/**
 * Sleep helper for delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call API with exponential backoff retry logic
 */
const callWithRetry = async (fn, maxAttempts = 3, initialDelayMs = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        const backoffMs = initialDelayMs * Math.pow(2, attempt - 2);
        console.log(
          `Retry attempt ${attempt}/${maxAttempts} - Waiting ${backoffMs}ms...`,
        );
        await sleep(backoffMs);
      }
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const isRetryable =
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        error.code === "ECONNABORTED" ||
        error.code === "ENOTFOUND";

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }
      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed (${status || error.code}), will retry...`,
      );
    }
  }
  throw lastError;
};

/**
 * Call Gemini API (fallback)
 */
const callGemini = async (userQuery, systemPrompt) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  try {
    console.log("Making Gemini API request...");
    const response = await callWithRetry(
      async () => {
        return await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              { parts: [{ text: systemPrompt }, { text: userQuery }] },
            ],
          },
          { timeout: 30000 },
        );
      },
      3,
      1000,
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw error;
  }
};

/**
 * Generate mock response for development
 */
const generateMockResponse = (userQuery) => {
  const responses = {
    budget:
      "Based on your income and expenses, I recommend allocating 50% to needs, 30% to wants, and 20% to savings. For example, if you earn Rs. 50,000 monthly, allocate Rs. 25,000 for needs, Rs. 15,000 for wants, and Rs. 10,000 for savings.",
    invest:
      "For your risk tolerance, consider a diversified portfolio with a mix of mutual funds and fixed deposits. You could start a SIP of Rs. 5,000-10,000 monthly in index funds.",
    save: "To reach your savings goal, try setting up automatic transfers on payday. Even saving Rs. 500-1,000 daily can add up to Rs. 15,000-30,000 monthly.",
    tax: "Keep track of deductible expenses under Section 80C (up to Rs. 1.5 lakh) throughout the year for better tax planning.",
    debt: "Focus on paying off high-interest debt first while maintaining minimum payments on others. Credit card debt at 36-42% interest should be prioritized.",
    default:
      "I can help with budgeting, investments, savings, tax planning, and debt management in Indian Rupees. What would you like to know?",
  };

  for (const [key, value] of Object.entries(responses)) {
    if (userQuery.toLowerCase().includes(key)) {
      return value;
    }
  }
  return responses.default;
};

/**
 * Call LLM with context
 * Provider priority: HuggingFace > Gemini > Mock
 */
const callLLM = async (userQuery, systemPrompt, options = {}) => {
  const providers = [];

  // HuggingFace (primary)
  if (process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY) {
    providers.push({
      name: "HuggingFace",
      call: () => hfService.callLLM(userQuery, systemPrompt, options),
    });
  }

  // Gemini (fallback)
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Gemini",
      call: () => callGemini(userQuery, systemPrompt),
    });
  }

  // Mock (development fallback)
  providers.push({
    name: "Mock",
    call: () => Promise.resolve(generateMockResponse(userQuery)),
  });

  let lastError = null;

  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name} provider...`);
      const response = await provider.call();
      console.log(`${provider.name} succeeded`);
      return response;
    } catch (error) {
      console.error(`${provider.name} failed:`, error.message);
      lastError = error;
    }
  }

  throw lastError || new Error("All LLM providers failed");
};

module.exports = {
  callLLM,
  callWithRetry,
};
