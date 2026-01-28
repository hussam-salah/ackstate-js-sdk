import { Event } from "./event";
interface InboxConfig {
    apiKey: string;
    projectId: string;
    consumerId: string;
}
export declare class Inbox {
    private readonly config;
    private activeEventIds;
    constructor(config: InboxConfig);
    next(): Promise<Event | null>;
    ack(event: Event): Promise<void>;
    fail(event: Event, reason?: string): Promise<void>;
    replay(eventId: string): Promise<void>;
    private validateConfig;
}
export {};
