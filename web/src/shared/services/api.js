// Picks the real backend or the in-browser mock based on VITE_USE_MOCK.
// The UI only ever imports { api } from here, so flipping the env var
// switches the whole app between mock and live with zero code changes.
import { ENV } from "../../config/env.js";
import { api as mockApi } from "./mockServer.js";
import { api as realApi } from "./realApi.js";

export const api = ENV.USE_MOCK ? mockApi : realApi;
export const IS_MOCK = ENV.USE_MOCK;
