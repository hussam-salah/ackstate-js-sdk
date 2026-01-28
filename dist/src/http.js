import { request } from "undici";
import { AuthError, NetworkError, LeaseLostError, NotFoundError, } from "./errors";
const API_BASE = "https://api.yourdomain.com/v1";
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
        const res = await request(`${API_BASE}/events/next`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "X-Project-Id": projectId,
                "X-Consumer-Id": consumerId,
            },
        });
        if (res.statusCode === 204)
            return null;
        await handleResponse(res);
        return (await res.body.json());
    }
    catch (err) {
        if (err instanceof Error)
            throw err;
        throw new NetworkError("Network failure");
    }
}
export async function ackEvent(apiKey, consumerId, eventId) {
    try {
        const res = await request(`${API_BASE}/events/${eventId}/ack`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "X-Consumer-Id": consumerId,
            },
        });
        await handleResponse(res);
    }
    catch (err) {
        if (err instanceof Error)
            throw err;
        throw new NetworkError("Network failure");
    }
}
export async function failEvent(apiKey, consumerId, eventId, reason) {
    try {
        const res = await request(`${API_BASE}/events/${eventId}/fail`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "X-Consumer-Id": consumerId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
        });
        await handleResponse(res);
    }
    catch (err) {
        if (err instanceof Error)
            throw err;
        throw new NetworkError("Network failure");
    }
}
export async function replayEvent(apiKey, eventId) {
    try {
        const res = await request(`${API_BASE}/events/${eventId}/replay`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        await handleResponse(res);
    }
    catch (err) {
        if (err instanceof Error)
            throw err;
        throw new NetworkError("Network failure");
    }
}
