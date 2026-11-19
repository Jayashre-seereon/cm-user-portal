import api from "./axios";
import { sharedRequest } from "../utils/sharedRequest";

export async function getDashboard({ force = false } = {}) {
  return sharedRequest(
    "GET /user/dashboard",
    async () => {
      const response = await api.get("/user/dashboard");
      return response.data;
    },
    { force }
  );
}
