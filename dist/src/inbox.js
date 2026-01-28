import { freezeEvent } from "./event";
import { getNextEvent, ackEvent, failEvent, replayEvent } from "./http";
import { StateViolationError } from "./errors";
export class Inbox {
    constructor(config) {
        this.config = config;
        this.activeEventIds = new Set();
        this.validateConfig(config);
    }
    async next() {
        const res = await getNextEvent(this.config.apiKey, this.config.projectId, this.config.consumerId);
        if (!res)
            return null;
        const event = {
            id: res.event.id,
            attempt: res.event.attempt,
            receivedAt: res.event.received_at,
            headers: res.event.headers,
            body: Buffer.from(res.event.body, "base64"),
        };
        this.activeEventIds.add(event.id);
        return freezeEvent(event);
    }
    async ack(event) {
        if (!this.activeEventIds.has(event.id)) {
            throw new StateViolationError("No active lease for this event");
        }
        await ackEvent(this.config.apiKey, this.config.consumerId, event.id);
        this.activeEventIds.delete(event.id);
    }
    async fail(event, reason) {
        if (!this.activeEventIds.has(event.id)) {
            throw new StateViolationError("No active lease for this event");
        }
        await failEvent(this.config.apiKey, this.config.consumerId, event.id, reason);
        this.activeEventIds.delete(event.id);
    }
    async replay(eventId) {
        await replayEvent(this.config.apiKey, eventId);
    }
    validateConfig(config) {
        if (!config.apiKey?.trim()) {
            throw new Error("apiKey is required and cannot be empty");
        }
        if (!config.projectId?.trim()) {
            throw new Error("projectId is required and cannot be empty");
        }
        if (!config.consumerId?.trim()) {
            throw new Error("consumerId is required and cannot be empty");
        }
    }
}
