import { request } from "undici";
import {
  AuthError,
  NetworkError,
  LeaseLostError,
  NotFoundError,
} from "./errors.js";

const API_BASE = "http://localhost:80";

async function handleResponse(res: any) {
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

export interface EventResponse {
  event: {
    id: string;
    attempt: number;
    received_at: string;
    headers: Record<string, string>;
    body: string;
  };
}

export async function getNextEvent(
  apiKey: string,
  projectId: string,
  consumerId: string
): Promise<EventResponse | null> {
  try {
    const params = new URLSearchParams({
      projectId,
      consumerId,
    });

    const res = await request(`${API_BASE}/events/next?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.statusCode === 204) return null;

    await handleResponse(res);

    const text = await res.body.text();
    if (!text) return null;

    return JSON.parse(text);
    // return (await res.body.json()) as EventResponse;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new NetworkError("Network failure");
  }
}

export async function ackEvent(
  apiKey: string,
  consumerId: string,
  eventId: string
) {
  try {
    const params = new URLSearchParams({
      consumerId,
    });

    const res = await request(`${API_BASE}/events/${eventId}/ack?${params.toString()}`, {
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

export async function failEvent(
  apiKey: string,
  consumerId: string,
  eventId: string,
  reason?: string
) {
  try {
    const params = new URLSearchParams({
      consumerId,
    });

    const res = await request(`${API_BASE}/events/${eventId}/fail?${params.toString()}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });

    await handleResponse(res);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new NetworkError("Network failure");
  }
}

export async function replayEvent(apiKey: string, eventId: string) {
  try {
    const res = await request(`${API_BASE}/events/${eventId}/replay`, {
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
