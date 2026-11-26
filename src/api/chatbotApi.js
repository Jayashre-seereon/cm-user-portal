import api from "./axios";

/**
 * Career Bee assistant API.
 * Uses the shared axios instance, so a logged-in user's token (and the
 * refresh-on-401 logic) applies automatically; guests call it without a token.
 */

// Guided-flow entry points (same as the server's MAIN_MENU_OPTIONS), used until /config answers.
export const CHATBOT_DEFAULT_MENU = [
  { label: "Entrance Exam", step: "browse", params: { m: "exam" } },
  { label: "Institutes", step: "browse", params: { m: "institute" } },
  { label: "Scholarship", step: "browse", params: { m: "scholarship" } },
  { label: "Quiz", step: "browse", params: { m: "quiz" } },
  { label: "Career Archive", step: "career.streams", params: {} },
  { label: "Career Psychometric Assessment", step: "psychometric", params: {} },
  { label: "Book Your Mentor", step: "browse", params: { m: "mentor" } },
  { label: "Career & Personality Videos", step: "browse", params: { m: "video" } },
  { label: "Study Abroad", step: "browse", params: { m: "abroad" } },
  { label: "Career Insights", step: "browse", params: { m: "newsletter" } },
  { label: "Subscriptions", step: "plans", params: {} },
  { label: "Help & Support", step: "help", params: {} },
];

export const CHATBOT_DEFAULT_CONFIG = {
  enabled: true,
  aiEnabled: false,
  name: "Career Bee",
  greeting:
    "Hi! I'm Career Bee. Ask me anything about careers, exams, colleges, scholarships, mentors or how to use CareerMap.",
  menuPrompt: "Alright, let's get started! What do you want to know more about?",
  menu: CHATBOT_DEFAULT_MENU,
  starterPrompts: [
    "Which careers suit me?",
    "How do I prepare for JEE?",
    "Show me scholarships for engineering",
    "How do I book a mentor?",
  ],
  maxMessageLength: 1000,
};

/** Keeps only well-formed option chips: { label, step, params }. */
export function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .filter((option) => option && typeof option.label === "string" && option.label.trim() && typeof option.step === "string")
    .slice(0, 40)
    .map((option) => ({
      label: option.label.trim(),
      step: option.step,
      params: option.params && typeof option.params === "object" ? option.params : {},
    }));
}

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
        const menu = normalizeOptions(data.menu);

        return {
          ...CHATBOT_DEFAULT_CONFIG,
          enabled: data.enabled !== false,
          aiEnabled: Boolean(data.aiEnabled),
          name: typeof data.name === "string" && data.name.trim() ? data.name : CHATBOT_DEFAULT_CONFIG.name,
          greeting:
            typeof data.greeting === "string" && data.greeting.trim() ? data.greeting : CHATBOT_DEFAULT_CONFIG.greeting,
          menuPrompt:
            typeof data.menuPrompt === "string" && data.menuPrompt.trim() ? data.menuPrompt : CHATBOT_DEFAULT_CONFIG.menuPrompt,
          menu: menu.length ? menu : CHATBOT_DEFAULT_CONFIG.menu,
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

function normalizeAnswer(response) {
  const data = response?.data?.data || {};
  return {
    reply: typeof data.reply === "string" ? data.reply : "",
    links: Array.isArray(data.links) ? data.links : [],
    pages: Array.isArray(data.pages) ? data.pages : [],
    options: normalizeOptions(data.options),
    source: data.source || "",
  };
}

/**
 * POST /chatbot/ask
 * @param {Object} params
 * @param {string} params.message - The new user message (1..1000 chars)
 * @param {{role: "user"|"assistant", content: string}[]} [params.history] - Recent turns (≤ 20)
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{reply: string, links: Object[], pages: Object[], options: Object[], source: string}>}
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
  return normalizeAnswer(response);
}

/**
 * POST /chatbot/flow — one guided step (the option chip the user tapped).
 * @param {{ step: string, params?: object, signal?: AbortSignal }} params
 */
export async function flowChatbot({ step, params = {}, signal } = {}) {
  const response = await api.post("/chatbot/flow", { step, params }, { signal, timeout: 30000 });
  return normalizeAnswer(response);
}
