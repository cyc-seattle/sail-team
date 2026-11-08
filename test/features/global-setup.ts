import { rm } from "node:fs/promises";
import { authentikLock } from "./support";
import { cleanUp, staleVisitors } from "./visitors";

// Once a run, before any scenario: clear what an earlier run left behind, if it died before cleaning up.
export default async function globalSetup() {
  await rm(authentikLock, { recursive: true, force: true });
  for (const email of await staleVisitors()) {
    await cleanUp(email);
  }
}
