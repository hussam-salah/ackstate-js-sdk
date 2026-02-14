# AckState JavaScript SDK

### **An event is a fact: it exists once received, is seen once delivered, and is done only when acknowledged.**

### Install
```bash
npm install @ackstate/js-sdk
```

### Basic Usage

```javascript
import { Inbox, LeaseLostError, NetworkError } from "@ackstate/js-sdk";

const inbox = new Inbox({
  apiKey: process.env.ACK_STATE_API_KEY,
  projectId: "proj_123",
  consumerId: "worker-1",
});

async function run() {
  while (true) { // or your long running process condition

    const event = await inbox.next();
    if (!event) break;

    try {
      // event.body is raw bytes — parse only if you need to
      const payload = JSON.parse(event.body.toString("utf8"));

      await handleBusinessLogic(payload);

      await inbox.ack(event);
    } catch (err) {
      if (err instanceof LeaseLostError) {
        // Another worker took over. Do nothing.
        return;
      }

      if (err instanceof NetworkError) {
        // Optional: crash or retry at process level
        throw err;
      }

      await inbox.fail(event, err instanceof Error ? err.message : undefined);
    }
  }
}

run().catch(console.error);
```

### Note
- Each pulled event with `inbox.next()` gets leased for 20 seconds
- In this lease period, `inbox.ack()` or `inbox.fail()` is expected
- If the event wasn't acked or failed, it will be eligible to be pulled again  

### Guarantees

- "An event is delivered to only one consumer at a time"
- "Events are acknowledged only after successful processing"
- "Failed events are retried safely"
- "Replay is explicit and intentional"
- "The SDK never hides state or guesses outcomes"

### What This SDK Does Not Do
- Retry your business logic
- Auto-extend leases
- Parse payloads
- Hide failures
- Infer success

### API Reference

For detailed API documentation, see [Docs](https://github.com/hussam-salah/ackstate-js-sdk/blob/main/docs/getting-started.md).

