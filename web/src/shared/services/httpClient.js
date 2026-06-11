import { ENV } from "../../config/env.js";
import { getToken, triggerUnauthorized } from "../auth/session.js";

function buildUrl(path, params) {
  let url = ENV.API_BASE_URL + path;
  if (params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") q.append(k, v);
    });
    const s = q.toString();
    if (s) url += "?" + s;
  }
  return url;
}

async function request(path, { method = "GET", body, params } = {}) {
  const token = getToken();
  const res = await fetch(buildUrl(path, params), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    triggerUnauthorized();
    throw new Error("Session expired. Please sign in again.");
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    // 404 from backend means route doesn't exist — treat as empty, not a crash
    if (res.status === 404) throw new Error("not_found");
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}

export const http = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};
