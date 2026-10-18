import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apiKeyFromAuthorization, curlExample } from "./apiKeys";

const KEY = "hcg_" + "a1B2_-".repeat(7) + "z";

void describe("apiKeyFromAuthorization", () => {
  void it("takes a well-formed bearer key", () => {
    assert.equal(KEY.length, 47);
    assert.equal(apiKeyFromAuthorization(`Bearer ${KEY}`), KEY);
    assert.equal(apiKeyFromAuthorization(`bearer ${KEY}`), KEY);
  });

  void it("ignores everything else", () => {
    for (const header of [
      null,
      "",
      KEY,
      `Basic ${KEY}`,
      `Bearer ${KEY}x`,
      `Bearer ${KEY.slice(0, -1)}`,
      `Bearer ${KEY} extra`,
      `Bearer ${KEY.replace("hcg_", "abc_")}`,
      `Bearer ${KEY.slice(0, -1)}$`,
      "Bearer some-session-token",
    ]) {
      assert.equal(apiKeyFromAuthorization(header), null, String(header));
    }
  });
});

void describe("curlExample", () => {
  void it("embeds a valid JSON body", () => {
    const example = curlExample(
      "https://example.test/api/graphql",
      "2026-10-01T00:00:00Z",
      "2026-10-08T00:00:00Z",
    );
    const body = /-d '(.*)'$/m.exec(example)?.[1];
    assert.ok(body);
    const { query } = JSON.parse(body) as { query: string };
    assert.match(query, /steps\(range: \{start: "2026-10-01T00:00:00Z"/);
    assert.match(example, /^curl -s https:\/\/example\.test\/api\/graphql/);
  });
});
