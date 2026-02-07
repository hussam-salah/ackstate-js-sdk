# AckLedger API Reference

This document describes the public REST API endpoints for AckLedger, a webhook ingestion and event processing service.

All endpoints are prefixed with `/v1/`. Authentication is via API key passed in the `Authorization` header as `Bearer <api_key>`.

---

## Ingest Endpoints

### Ingest a Webhook Event (Generic)

Ingest a webhook event for a given project. The provider can be auto-detected from headers/body, or you can use the provider-hinted endpoint.

**Endpoint:** `POST /v1/ingest/{projectId}`

**Path Parameters:**
- `projectId` (string, required) – Your project identifier.

**Headers:**
- Any headers from the original webhook will be captured and normalized.
- `Authorization` header values are redacted in storage.

**Request Body:**
- Raw HTTP body (bytes). Can be empty.

**Response:**
- `202 Accepted` with JSON body:
  ```json
  {
    "id": "evd"
  }
  ```
- The `id` is a unique identifier for the ingested event.

**Example:**
```bash
curl -X POST https://api.ackstate.com/v1/ingest/proj_abc123 \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.succeeded","id":"evt_123"}'
```

### Ingest a Webhook Event (Provider-Hinted)

Same as above, but you can explicitly specify the provider (e.g., `stripe`, `github`). This can help with provider‑specific parsing.

**Endpoint:** `POST /v1/ingest/{provider}/{projectId}`

**Path Parameters:**
- `provider` (string, required) – Provider name (e.g., `stripe`, `github`).
- `projectId` (string, required) – Your project identifier.

**Headers & Body:** Same as generic endpoint.

**Response:** Same as generic endpoint.

**Example:**
```bash
curl -X POST https://api.ackstate.com/v1/ingest/stripe/proj_abc123 \
  -H "Stripe-Signature: t=..." \
  -d '{"id":"evt_123",...}'
```

---

## Event Pull Endpoints

### Lease Next Event

Retrieve the next unprocessed event for a given project and consumer. This endpoint implements a pull‑based consumer pattern. The leased event will be marked as “in‑flight” for a configurable lease duration.

**Endpoint:** `GET /v1/events/next`

**Query Parameters:**
- `projectId` (string, required) – Your project identifier.
- `consumerId` (string, required) – Identifier for your consumer (e.g., `worker‑1`).

**Response:**
- `200 OK` with JSON body containing the leased event:
  ```json
  {
    "event": {
      "id": "evt_123",
      "projectId": "proj_abc123",
      "provider": "stripe",
      "headers": { "content-type": "YXBwbGljYXRpb24vanNvbg==" },
      "body": "eyJpZCI6ImV2dF8xMjMifQ==",
      "createdAt": "2025-02-07T18:20:00Z",
      "state": "LEASED",
      "leaseExpiresAt": "2025-02-07T18:25:00Z"
    }
  }
  ```
- `204 No Content` if no events are available.

**Example:**
```bash
curl "https://api.ackstate.com/v1/events/next?projectId=proj_abc123&consumerId=worker-1" \
  -H "Authorization: Bearer sk_live_..."
```

---

## Event State Management Endpoints

### Acknowledge Event

Mark a leased event as successfully processed. This removes the event from the queue and archives it.

**Endpoint:** `POST /v1/events/{eventId}/ack`

**Path Parameters:**
- `eventId` (string, required) – The event ID (from the ingest response or leased event).

**Query Parameters:**
- `consumerId` (string, required) – The consumer that leased the event.

**Response:**
- `200 OK` with JSON:
  ```json
  {
    "message": "Event marked as acknowledged."
  }
  ```

**Example:**
```bash
curl -X POST "https://api.ackstate.com/v1/events/evt_123/ack?consumerId=worker-1" \
  -H "Authorization: Bearer sk_live_..."
```

### Fail Event

Mark a leased event as failed, optionally providing a reason. The event will be retried according to your project’s retry policy.

**Endpoint:** `POST /v1/events/{eventId}/fail`

**Path Parameters:**
- `eventId` (string, required) – The event ID.

**Query Parameters:**
- `consumerId` (string, required) – The consumer that leased the event.

**Request Body:**
- Plain text reason (string).

**Response:**
- `200 OK` with JSON:
  ```json
  {
    "message": "Event marked as failed."
  }
  ```

**Example:**
```bash
curl -X POST "https://api.ackstate.com/v1/events/evt_123/fail?consumerId=worker-1" \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: text/plain" \
  -d "Downstream service timeout"
```

### Replay Event

Force a replay of a specific event (by its ID). The event will be re‑ingested as if it were a new webhook, and will flow through the processing pipeline again.

**Endpoint:** `POST /v1/events/{eventId}/replay`

**Path Parameters:**
- `eventId` (string, required) – The event ID.

**Response:**
- `200 OK` with JSON:
  ```json
  {
    "message": "Replay started successfully."
  }
  ```

**Example:**
```bash
curl -X POST "https://api.ackstate.com/v1/events/{eventId}/replay" \
  -H "Authorization: Bearer sk_live_..."
```

---

## Notes

- All request/response bodies are UTF‑8 encoded.
- Header values are base64‑encoded in storage (except `Authorization` which is redacted).
- Event bodies are stored as base64‑encoded bytes.
- Lease duration is configurable per project (default: 5 seconds).
- The `consumerId` is used to enforce at‑most‑once leasing; the same consumer cannot lease two events concurrently unless the previous lease has expired or been acknowledged/failed.

For client‑side convenience, use the official [AckState JavaScript SDK](https://github.com/hussam-salah/ackstate-js-sdk) (`@ackstate/js-sdk` on npm).
