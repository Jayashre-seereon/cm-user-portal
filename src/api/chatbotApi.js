import api from "./axios";

/**
 * Career Bee assistant API.
 * Uses the shared axios instance, so a logged-in user's token (and the
 * refresh-on-401 logic) applies automatically; guests call it without a token.
 */

export const CHATBOT_DEFAULT_CONFIG = {
  enabled: true,
  aiEnabled: false,
  name: "Career Bee",
  greeting:
    "Hi! I'm Career Bee. Ask me anything about careers, exams, colleges, scholarships, mentors or how to use CareerMap.",
  starterPrompts: [
    "Which careers suit me?",
    "How do I prepare for JEE?",
    "Show me scholarships for engineering",
    "How do I book a mentor?",
  ],
  maxMessageLength: 1000,
};

let configPromise = null;

/** GET /chatbot/config — cached per page load; any failure falls back to built-in defaults. */
export function getChatbotConfig() {
  if (!configPromise) {
    configPromise = api
      .get("/chatbot/config")
      .then((response) => {
        const data = response?.data?.data;
        if (!data || typeof data !== "object") {
          throw new Error("Invalid chatbot config");
        }
        const starterPrompts = Array.isArray(data.starterPrompts)
          ? data.starterPrompts.filter((prompt) => typeof prompt === "string" && prompt.trim())
          : [];
        const maxMessageLength = Number(data.maxMessageLength);

        return {
          ...CHATBOT_DEFAULT_CONFIG,
          enabled: data.enabled !== false,
          aiEnabled: Boolean(data.aiEnabled),
          name: typeof data.name === "string" && data.name.trim() ? data.name : CHATBOT_DEFAULT_CONFIG.name,
          greeting:
            typeof data.greeting === "string" && data.greeting.trim() ? data.greeting : CHATBOT_DEFAULT_CONFIG.greeting,
          starterPrompts: starterPrompts.length ? starterPrompts : CHATBOT_DEFAULT_CONFIG.starterPrompts,
          maxMessageLength:
            Number.isFinite(maxMessageLength) && maxMessageLength > 0
              ? maxMessageLength
              : CHATBOT_DEFAULT_CONFIG.maxMessageLength,
        };
      })
      .catch(() => {
        // Allow a later open to try again, but keep the bot usable now.
        configPromise = null;
        return { ...CHATBOT_DEFAULT_CONFIG };
      });
  }

  return configPromise;
}

/**
 * POST /chatbot/ask
 * @param {Object} params
 * @param {string} params.message - The new user message (1..1000 chars)
 * @param {{role: "user"|"assistant", content: string}[]} [params.history] - Recent turns (≤ 20)
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{reply: string, links: Object[], pages: Object[], source: string}>}
 */
export async function askChatbot({ message, history = [], signal } = {}) {
  const response = await api.post(
    "/chatbot/ask",
    {
      message,
      history,
      platform: "web",
    },
    {
      signal,
      timeout: 60000,
    }
  );

  const data = response?.data?.data || {};

  return {
    reply: typeof data.reply === "string" ? data.reply : "",
    links: Array.isArray(data.links) ? data.links : [],
    pages: Array.isArray(data.pages) ? data.pages : [],
    source: data.source || "",
  };
}
