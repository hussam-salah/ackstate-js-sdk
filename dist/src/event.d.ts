export interface Event {
    readonly id: string;
    readonly attempt: number;
    readonly receivedAt: string;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: Buffer;
}
export declare function freezeEvent(event: Event): Event;
