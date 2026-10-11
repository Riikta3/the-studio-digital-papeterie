import assert from "node:assert/strict";
import test from "node:test";

import { probeHttps } from "./probe.ts";

test("any HTTP answer means the TLS handshake completed", async () => {
  for (const status of [200, 308, 404, 500]) {
    const calls = [];
    const fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(null, { status });
    };
    assert.equal(await probeHttps("https://a-b-c.com/", fetch), true, String(status));
    assert.equal(calls[0].url, "https://a-b-c.com/");
    assert.equal(calls[0].init.method, "HEAD");
    assert.equal(calls[0].init.redirect, "manual");
    assert.ok(calls[0].init.signal instanceof AbortSignal);
  }
});

test("a network, TLS or timeout error means not yet", async () => {
  for (const error of [new TypeError("fetch failed"), new DOMException("timeout", "TimeoutError")]) {
    const fetch = async () => {
      throw error;
    };
    assert.equal(await probeHttps("https://a-b-c.com/", fetch), false);
  }
});

test("the probe takes the caller's timeout, never more than 10 s", async () => {
  const asked = [];
  const realTimeout = AbortSignal.timeout.bind(AbortSignal);
  AbortSignal.timeout = (ms) => {
    asked.push(ms);
    return realTimeout(ms);
  };
  try {
    const fetch = async () => new Response(null, { status: 404 });
    await probeHttps("https://a-b-c.com/", fetch);
    await probeHttps("https://a-b-c.com/", fetch, 4_000);
    await probeHttps("https://a-b-c.com/", fetch, 30_000);
  } finally {
    AbortSignal.timeout = realTimeout;
  }
  assert.deepEqual(asked, [10_000, 4_000, 10_000]);
});
