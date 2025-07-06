import axios from "axios";

const spacexAPI = axios.create({
  baseURL: process.env.REACT_APP_SPACEX_BASE_URL || "https://api.spacexdata.com"
,
  timeout: 10000,
});

export const fetchLaunches = () => spacexAPI.get("/v5/launches");
export const fetchLaunchpads = () => spacexAPI.get("/v4/launchpads");
export const fetchRockets = () => spacexAPI.get("/v4/rockets");
export const fetchPayloads = () => spacexAPI.get("/v4/payloads");
