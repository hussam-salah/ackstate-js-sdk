export interface Event {
  readonly id: string;
  readonly attempt: number;
  readonly receivedAt: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Buffer;
}

export function freezeEvent(event: Event): Event {
  Object.freeze(event.headers);
  Object.freeze(event);
  return event;
}
