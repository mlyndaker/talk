import { createTransport } from "@sentry/react";
import { BaseTransportOptions, Transport } from "@sentry/types";

/**
 * Fake Transport for sentry that outputs to console.
 */
export function makeFakeDebugTransport(
  options: BaseTransportOptions
): Transport {
  return createTransport(options, (request) => {
    // eslint-disable-next-line no-console
    console.debug("sentry event", request.body);
    return Promise.resolve({});
  });
}
