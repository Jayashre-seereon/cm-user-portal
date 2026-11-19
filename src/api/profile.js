import api from "./axios";
import { sharedRequest } from "../utils/sharedRequest";

export async function getTestHistory({ force = false } = {}) {
  return sharedRequest(
    "GET /quiz/history",
    async () => {
      const response = await api.get("/quiz/history");
      return response?.data ?? null;
    },
    { force }
  );
}

export async function getMentorBookings({ force = false } = {}) {
  return sharedRequest(
    "GET /mentor-booking/my-mentor-bookings",
    async () => {
      const response = await api.get("/mentor-booking/my-mentor-bookings");
      return response?.data ?? null;
    },
    { force }
  );
}

export async function getSubscriptions({ force = false } = {}) {
  return sharedRequest(
    "GET /mentor-booking/my-subscriptions",
    async () => {
      const response = await api.get("/mentor-booking/my-subscriptions");
      return response?.data ?? null;
    },
    { force }
  );
}
