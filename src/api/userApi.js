import api from "./axios";

export async function updateUserProfile(payload) {
  const response = await api.put("/user/profile", payload);
  return response.data;
}

export async function changeUserPassword(payload) {
  const response = await api.put("/user/change-password", payload);
  return response.data;
}

export async function createHelpRequest(payload) {
  const response = await api.post("/helpandsupport", payload);
  return response.data;
}
