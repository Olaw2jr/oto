import type {Telemetry} from './types';

// Imported first in index.js, so this records when JS started running.
const startedAt = Date.now();
let reported = false;

// Reports how long the app took to become usable, once per launch (HA-07).
export const reportStartup = (telemetry: Telemetry) => {
  if (reported) return;
  reported = true;
  telemetry.metric('startup.ready_ms', Date.now() - startedAt);
};
