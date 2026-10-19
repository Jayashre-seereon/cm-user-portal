import api from "./axios";

export async function getDashboard() {
  const response = await api.get("/user/dashboard");
  return response.data;
}
