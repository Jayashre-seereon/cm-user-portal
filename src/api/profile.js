import api from "./axios";

export async function getTestHistory() {
  const response = await api.get("/quiz/history");
  return response?.data ?? null;
}

export async function getMentorBookings() {
  const response = await api.get("/mentor-booking/my-mentor-bookings");
  return response?.data ?? null;
}

export async function getSubscriptions() {
  const response = await api.get("/mentor-booking/my-subscriptions");
  return response?.data ?? null;
}
