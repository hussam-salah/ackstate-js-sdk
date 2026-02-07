export function freezeEvent(event) {
  Object.freeze(event.headers);
  Object.freeze(event);
  return event;
}