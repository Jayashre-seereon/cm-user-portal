import api from "./axios";

export const sendUserMessage = async (message) => {
  const response = await api.post("/send-message", { message });
  return response.data;
};
