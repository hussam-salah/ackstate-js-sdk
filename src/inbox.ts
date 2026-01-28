import { Event, freezeEvent } from "./event.js";
import {
  getNextEvent,
  ackEvent,
  failEvent,
  replayEvent,
  EventResponse
} from "./http.js";
import { StateViolationError } from "./errors.js";

interface InboxConfig {
  apiKey: string;
  projectId: string;
  consumerId: string;
}

export class Inbox {
  private activeEventIds = new Set<string>();

  constructor(private readonly config: InboxConfig) {
    this.validateConfig(config);
  }

  async next(): Promise<Event | null> {
    const res = await getNextEvent(
      this.config.apiKey,
      this.config.projectId,
      this.config.consumerId
    ) as EventResponse | null;

    if (!res) return null;

    const event: Event = {
      id: res.event.id,
      attempt: res.event.attempt,
      receivedAt: res.event.received_at,
      headers: res.event.headers,
      body: Buffer.from(res.event.body, "base64"),
    };

    this.activeEventIds.add(event.id);
    return freezeEvent(event);
  }

  async ack(event: Event): Promise<void> {
    if (!this.activeEventIds.has(event.id)) {
      throw new StateViolationError("No active lease for this event");
    }

    await ackEvent(this.config.apiKey, this.config.consumerId, event.id);
    this.activeEventIds.delete(event.id);
  }

  async fail(event: Event, reason?: string): Promise<void> {
    if (!this.activeEventIds.has(event.id)) {
      throw new StateViolationError("No active lease for this event");
    }

    await failEvent(
      this.config.apiKey,
      this.config.consumerId,
      event.id,
      reason
    );
    this.activeEventIds.delete(event.id);
  }

  async replay(eventId: string): Promise<void> {
    await replayEvent(this.config.apiKey, eventId);
  }

  private validateConfig(config: InboxConfig) {
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
