export interface EventResponse {
    event: {
        id: string;
        attempt: number;
        received_at: string;
        headers: Record<string, string>;
        body: string;
    };
}
export declare function getNextEvent(apiKey: string, projectId: string, consumerId: string): Promise<EventResponse | null>;
export declare function ackEvent(apiKey: string, consumerId: string, eventId: string): Promise<void>;
export declare function failEvent(apiKey: string, consumerId: string, eventId: string, reason?: string): Promise<void>;
export declare function replayEvent(apiKey: string, eventId: string): Promise<void>;
