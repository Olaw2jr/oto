import type {TelemetryProps} from './types';

const MAX_STRING = 200;
const MAX_MESSAGE = 300;
const MAX_STACK_LINES = 20;

// Keeps short primitives only, so nested objects that could carry personal
// data never leave the device.
export const sanitizeProps = (
  props: Record<string, unknown> = {},
): TelemetryProps => {
  const clean: TelemetryProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      clean[key] = value.slice(0, MAX_STRING);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      clean[key] = value;
    } else if (typeof value === 'boolean') {
      clean[key] = value;
    }
  }
  return clean;
};

export const describeError = (
  error: unknown,
): {name: string; message: string; stack?: string} => {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message.slice(0, MAX_MESSAGE),
      stack: error.stack?.split('\n').slice(0, MAX_STACK_LINES).join('\n'),
    };
  }
  return {name: 'NonError', message: String(error).slice(0, MAX_MESSAGE)};
};
