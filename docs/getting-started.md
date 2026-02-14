# Getting Started with AckLedger

AckLedger is a webhook ingestion and event processing service that guarantees at‑least‑once delivery with built‑in retries, leasing, and dead‑letter queues. This guide walks you through the steps to start using AckLedger.

---

## 1. Request Alpha Access

Visit [ackstate.com](https://ackstate.com) and request Alpha Access with your email address.

You’ll receive an invitation email with a temporary password and a link to the dashboard.

---

## 2. Sign In

Go to [ackstate.com/sign‑in](https://ackstate.com/sign‑in) and log in using the credentials from the invitation email.

---

## 3. Update Your Password (Optional but Recommended)

After your first login, you can update your password in the account settings for better security.

---

## 4. Create a Project

In settings > projects, click **“Create Project”** and give your project a name (e.g., “prod service-x webhooks”). Each project gets a unique `projectId` that you’ll use in API calls.

---

## 5. Generate an API Key

Inside your project, navigate to **“API Keys”** and create a new key, you can create multiple keys for the same project.

Use this key in the `Authorization` header as a Bearer token:

```
Authorization: Bearer sk_live_...
```

---

## 6. Start Ingesting Webhooks

Send webhooks to AckLedger using the [Ingest API](./api-reference.md#ingest-endpoints).

**Example with cURL:**

```bash
curl -X POST https://api.ackstate.com/v1/projects/proj_abc123/ingestions \
  -H "Authorization: Bearer sk_live_..."
  -d '{"event":"payment.succeeded","id":"evt_123"}'
```

---

## 7. Process Events

Consume events using the [Pull API](./api-reference.md#event-pull-endpoints). Lease events, process them, and then acknowledge or fail them.

**Example workflow:**

1. **Lease next event:**
   ```bash
      curl -X POST https://api.ackstate.com/v1/events/next
      -H "Authorization: Bearer sk_live_..."
      -d "{
      "projectId": "proj_abc123",
      "consumerId": "local-consumer-1"
      }"
   ```

2. **Process the event** (your business logic).

3. **Acknowledge successful processing:**
   ```bash
   curl -X POST "https://api.ackstate.com/v1/events/evt_123/acks \
   -H "Authorization: Bearer sk_live_..."
   -d "{ "consumerId": "consumerId=worker-1" }"
   ```

4. **If processing fails,** mark the event as failed with a reason:
   ```bash
   curl -X POST "https://api.ackstate.com/v1/events/evt_123/failures" \
   -H "Authorization: Bearer sk_live_..." \
   -H "Content-Type: text/plain" \
   -d "{"consumerId": "worker-1", "reason" : "Downstream service timeout"}"
   ```

---

## 8. Use the SDK (Optional)

For a more convenient integration, use the official **AckState JavaScript SDK**.

**Installation:**

```bash
npm install @ackstate/js-sdk
# or
yarn add @ackstate/js-sdk
```

**Basic usage:**

```javascript
import { AckLedgerClient } from '@ackstate/js-sdk';

const client = new AckLedgerClient({
  apiKey: 'sk_live_...',
  projectId: 'proj_abc123'
});

// Ingest a webhook
const { id } = await client.ingest({
  provider: 'stripe',
  headers: { 'stripe-signature': '...' },
  body: { id: 'evt_123', ... }
});

// Lease and process events
const event = await client.leaseNext('worker-1');
if (event) {
  try {
    await processEvent(event);
    await client.ack(event.id, 'worker-1');
  } catch (err) {
    await client.fail(event.id, 'worker-1', err.message);
  }
}
```

- **GitHub:** [https://github.com/hussam-salah/ackstate-js-sdk](https://github.com/hussam-salah/ackstate-js-sdk)
- **npm:** [https://www.npmjs.com/package/@ackstate/js-sdk](https://www.npmjs.com/package/@ackstate/js-sdk)

---

## 9. Explore the API Reference

For complete endpoint details, request/response schemas, and examples, see the [API Reference](./api-reference.md).

---

## Need Help?

- Check the [API Reference](./api-reference.md) for detailed endpoint documentation.
- Contact support at **team@ackstate.com** for Alpha‑program questions.

Welcome to AckState Ledger! 🚀
