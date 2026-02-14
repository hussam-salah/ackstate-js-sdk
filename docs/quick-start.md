# Quick Start

1. Create a project
2. Create API Key

3. Start ingesting, example

    ```
    curl --location --request POST 'https://api.ackstate.com/v1/ingest/prj_123' \
    --header 'Content-Type: application/json' \
    --header 'Stripe-Signature: t=1234567890,v1=abc123' \
    --header 'Authorization: Bearer your-api-key' \
    --data '{"id": "evt_123", "type": "payment.succeeded"}'
    ```

Event now is ingested and on RECEIVED state

4. Start Pulling, example

    ```
    curl --location --request POST 'https://api.ackstate.com/v1/events/next' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer your-api-key' \
    --data '{
        "projectId": "prj_123",
        "consumerId": "production_consumer_1"
    }'

    -- response 200 OK
        {
            "event": {
                "id": "evt_123", // ackstate event id
                "body": "eyJpZCIxK...", // base64  encoded
                "headers": {
                    "h1":"v1",
                    "h2":"v2"
                },
                "receivedAt": "2026-01-01T00:00:00.00Z",
                "leasedAt": "2026-01-01T00:00:01.00Z",
                "expiresAt": "2026-01-01T00:01:01.00Z"
            }
        }
    ```

Event now fetched and in DELIVERED state

5. Decode payload and process your event!
6. Ack your event, example

    ```
    curl --location --request POST 'https://api.ackstate.com/v1/events/ackstate-evt-123/acks' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer your-api-key' \
    --data '{
        "consumerId": "production_consumer_1"
    }'
    ```

Your event now is on ACKED state

7. Or Fail your event with optional reason

    ```
    curl --location 'https://api.ackstate.com/v1/events/ackstate-evt-123/failures' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer your-api-key' \
    --data '{
        "consumerId": "production_consumer_1"
    }'
    ```

Your event now is on FAILED state.

8. Optionally, you can Replay your event for extra round of processing

    ```
    curl --location --request POST 'https://api.ackstate.com/v1/events/ackstate-evt-123/replays' \
    --header 'Authorization: Bearer your-api-key' \
    --data ''
```

This sets the event state at RECEIVED and it will be eligible to be pulled again.
