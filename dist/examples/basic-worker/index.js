import { Inbox, LeaseLostError, NetworkError } from "@solomicros/ackstate-sdk";
const inbox = new Inbox({
    apiKey: "test-api-key",
    projectId: "test-project",
    consumerId: "example-worker",
});
async function handle(payload) {
    // Simulate business logic
    console.log("Processing event:", payload);
    // Uncomment to simulate failure
    // throw new Error("simulated failure");
}
async function run() {
    console.log("Worker started. Waiting for events...");
    while (true) {
        const event = await inbox.next();
        if (!event) {
            await sleep(1000);
            continue;
        }
        try {
            const payload = JSON.parse(event.body.toString("utf8"));
            await handle(payload);
            await inbox.ack(event);
            console.log(`ACKED event ${event.id}`);
        }
        catch (err) {
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
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
run().catch(console.error);
