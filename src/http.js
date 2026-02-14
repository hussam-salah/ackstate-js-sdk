import { request } from "undici";
import {
  AuthError,
  NetworkError,
  LeaseLostError,
  NotFoundError,
} from "./errors.js";

const API_BASE = "https://api.ackstate.com/v1";

async function handleResponse(res) {
  if (res.statusCode === 401 || res.statusCode === 403) {
    throw new AuthError("Invalid API credentials");
  }

  if (res.statusCode === 404) {
    throw new NotFoundError("Resource not found");
  }

  if (res.statusCode === 409) {
    throw new LeaseLostError("Lease lost");
  }

  if (res.statusCode >= 400) {
    throw new NetworkError(`HTTP ${res.statusCode}`);
  }

  return res;
}

export async function getNextEvent(apiKey, projectId, consumerId) {
  try {
    const body = {
      projectId,
      consumerId,
    };

    const res = await request(`${API_BASE}/events/next?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (res.statusCode === 204) return null;

    await handleResponse(res);

    const text = await res.body.text();
    if (!text) return null;

    return JSON.parse(text);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new NetworkError("Network failure");
  }
}

export async function ackEvent(apiKey, consumerId, eventId) {
  try {
    const res = await request(`${API_BASE}/events/${eventId}/acks?`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ consumerId }),
    });

    await handleResponse(res);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new NetworkError("Network failure");
  }
}

export async function failEvent(apiKey, consumerId, eventId, reason) {
  try {
    const res = await request(`${API_BASE}/events/${eventId}/failures`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ consumerId, reason }),
    });

    await handleResponse(res);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new NetworkError("Network failure");
  }
}

export async function replayEvent(apiKey, eventId) {
  try {
    const res = await request(`${API_BASE}/events/${eventId}/replays`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    await handleResponse(res);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new NetworkError("Network failure");
  }
}