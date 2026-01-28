import { Inbox, LeaseLostError, NetworkError } from "@solomicros/ackstate-sdk";

const inbox = new Inbox({
  apiKey: "test-api-key",
  projectId: "test-project",
  consumerId: "example-worker",
});

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function handle(payload: any) {
  // Simulate business logic
  console.log("Processing event:", payload);
  // Simulate 1 second of processing
  await delay(1000);
  
  // Uncomment to simulate failure
  // throw new Error("simulated failure");
}

async function run() {
  console.log("Worker started. Waiting for events...");

  while (true) {
    const event = await inbox.next();

    if (!event) {
      await sleep(3000);
      continue;
    }

    const raw = event?.body.toString("utf8");
    let payload: unknown;
    try {
        payload = raw.length ? JSON.parse(raw) : null;
    } catch {
        console.log("Non-JSON payload received");
        payload = raw;
    }

    try {
      await handle(payload);
      await inbox.ack(event);
      console.log(`ACKED event ${event.id}`);
    } catch (err) {
      if (err instanceof LeaseLostError) {
        console.log(`Lease lost for event ${event.id}`);
        return;
      }

      if (err instanceof NetworkError) {
        console.error("Network error, exiting:", err);
        throw err;
      }

      await inbox.fail(event, err instanceof Error ? err.message : undefined);
      console.log(`FAILED event ${event.id}`);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

run().catch(console.error);
