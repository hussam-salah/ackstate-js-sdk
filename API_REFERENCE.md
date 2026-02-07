# AckState JavaScript SDK API Reference

## Overview

The AckState SDK provides a simple way to consume webhook events with guaranteed exactly-once delivery semantics.

## Installation

```bash
npm install @solomicros/ackstate
```

## Classes

### `Inbox`

Main class for consuming events.

#### Constructor

```javascript
new Inbox(config)
```

**Parameters:**
- `config` (Object):
  - `apiKey` (string): Your AckState API key
  - `projectId` (string): Your project identifier
  - `consumerId` (string): Unique identifier for this consumer/worker

**Example:**
```javascript
import { Inbox } from '@solomicros/ackstate';

const inbox = new Inbox({
  apiKey: process.env.ACK_STATE_API_KEY,
  projectId: 'proj_123',
  consumerId: 'worker-1'
});
```

#### Methods

##### `async next()`

Fetches the next available event. Returns `null` if no events are available.

**Returns:** `Promise<Event | null>`

**Example:**
```javascript
const event = await inbox.next();
if (!event) {
  // No events available
}
```

##### `async ack(event)`

Acknowledges successful processing of an event.

**Parameters:**
- `event` (Event): The event to acknowledge

**Throws:** `StateViolationError` if no active lease exists for this event

**Example:**
```javascript
await inbox.ack(event);
```

##### `async fail(event, reason)`

Marks an event as failed.

**Parameters:**
- `event` (Event): The event that failed
- `reason` (string, optional): Description of why the event failed

**Throws:** `StateViolationError` if no active lease exists for this event

**Example:**
```javascript
await inbox.fail(event, 'Processing error');
```

##### `async replay(eventId)`

Replays a specific event by ID.

**Parameters:**
- `eventId` (string): The ID of the event to replay

**Example:**
```javascript
await inbox.replay('evt_abc123');
```

### Event Object

Events returned by `inbox.next()` have the following structure:

```javascript
{
  id: string,           // Unique event identifier
  attempt: number,      // Attempt number (starts at 1)
  receivedAt: string,   // ISO timestamp when event was received
  headers: Object,      // HTTP headers from the original webhook
  body: Buffer          // Raw payload as Buffer
}
```

**Example usage:**
```javascript
const event = await inbox.next();
console.log(event.id);           // 'evt_abc123'
console.log(event.attempt);      // 1
console.log(event.receivedAt);   // '2024-01-01T12:00:00Z'

// Parse JSON payload
const payload = JSON.parse(event.body.toString('utf8'));
```

### Error Classes

All errors extend the built-in `Error` class.

#### `AuthError`
Thrown when API credentials are invalid.

#### `NetworkError`
Thrown for network failures or HTTP errors (except 401, 403, 404, 409).

#### `LeaseLostError`
Thrown when another consumer has taken over the lease for an event.

#### `StateViolationError`
Thrown when attempting to ack/fail an event without an active lease.

#### `NotFoundError`
Thrown when a requested resource doesn't exist.

**Example error handling:**
```javascript
try {
  await inbox.ack(event);
} catch (err) {
  if (err instanceof LeaseLostError) {
    // Another worker took over - do nothing
  } else if (err instanceof NetworkError) {
    // Network issue - may want to retry or exit
    throw err;
  } else {
    // Other errors
    console.error(err);
  }
}
```

## Usage Pattern

```javascript
import { Inbox, LeaseLostError, NetworkError } from '@solomicros/ackstate';

const inbox = new Inbox({
  apiKey: process.env.ACK_STATE_API_KEY,
  projectId: 'proj_123',
  consumerId: 'worker-1'
});

async function run() {
  while (true) {
    const event = await inbox.next();
    if (!event) {
      await sleep(3000);
      continue;
    }

    try {
      // Process the event
      const payload = JSON.parse(event.body.toString('utf8'));
      await processBusinessLogic(payload);
      
      // Acknowledge successful processing
      await inbox.ack(event);
    } catch (err) {
      if (err instanceof LeaseLostError) {
        // Another worker took over
        return;
      }
      
      if (err instanceof NetworkError) {
        // Network issue - may want to crash and restart
        throw err;
      }
      
      // Business logic failure
      await inbox.fail(event, err.message);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run().catch(console.error);
```

## Guarantees

- **Exactly-once delivery**: Each event is delivered to only one consumer at a time
- **Lease-based**: Events are leased for 5 seconds after being pulled
- **Explicit acknowledgment**: Events must be explicitly acked or failed
- **Safe retries**: Failed events can be retried without data loss
- **No hidden state**: The SDK never hides failures or guesses outcomes

## Notes

- Each event pulled with `inbox.next()` gets a 5-second lease
- Within this lease period, you must call `inbox.ack()` or `inbox.fail()`
- If the lease expires without acknowledgment, the event becomes available for another consumer
- The SDK does not automatically retry your business logic
- The SDK does not automatically extend leases
- The SDK does not parse payloads (you must parse JSON if needed)