import api from "./axios";

/**
 * Global search across multiple entities (careers, institutions, exams, mentors, scholarships, etc.)
 * @param {Object} params
 * @param {string} params.query - Search term
 * @param {string} [params.type='all'] - Filter by category/group (all, careers, institutions, etc.)
 * @param {number} [params.limit=10] - Number of items to return
 * @param {AbortSignal} [params.signal] - AbortSignal for request cancellation
 */
export async function globalSearch({ query = "", type = "all", limit = 10, signal } = {}) {
  const trimmed = String(query).trim();
  if (!trimmed) {
    return {
      success: true,
      query: "",
      total: 0,
      results: [],
      grouped: {},
    };
  }

  const response = await api.get("/search", {
    params: {
      q: trimmed,
      type: type || "all",
      limit,
    },
    withCredentials: true,
    signal,
  });

  return response.data;
}

/**
 * Quick search suggestions endpoint
 * @param {Object} params
 * @param {string} params.query - Search term
 * @param {number} [params.limit=8] - Max suggestions to return
 * @param {AbortSignal} [params.signal] - AbortSignal for request cancellation
 */
export async function getSearchSuggestions({ query = "", limit = 8, signal } = {}) {
  const trimmed = String(query).trim();
  if (!trimmed) {
    return {
      success: true,
      suggestions: [],
    };
  }

  const response = await api.get("/search/suggestions", {
    params: {
      q: trimmed,
      limit,
    },
    withCredentials: true,
    signal,
  });

  return response.data;
}
