import axios from "axios";

const spacexAPI = axios.create({
  baseURL: import.meta.env.VITE_SPACEX_BASE_URL,
  timeout: 10000,
});

export const fetchLaunches = () => spacexAPI.get("/v5/launches");
export const fetchLaunchpads = () => spacexAPI.get("/v4/launchpads");
export const fetchRockets = () => spacexAPI.get("/v4/rockets");
export const fetchPayloads = () => spacexAPI.get("/v4/payloads");
