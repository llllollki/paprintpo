// Fulfillment adapter registration.
// Import and register each vendor adapter here.
// Phase D will gate the stub behind NODE_ENV !== "production".

import { registerAdapter } from "./registry";
import { StubAdapter } from "./adapters/stub";

registerAdapter(new StubAdapter());
