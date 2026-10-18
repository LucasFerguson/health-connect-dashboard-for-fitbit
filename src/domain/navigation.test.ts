import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NAV_GROUPS,
  SYSTEM_ITEMS,
  findActiveNav,
  isActiveHref,
} from "./navigation";

void describe("navigation", () => {
  void it("matches a page and the pages beneath it, but not lookalikes", () => {
    assert.equal(isActiveHref("/day", "/day"), true);
    assert.equal(isActiveHref("/day", "/day/2026-10-01"), true);
    assert.equal(isActiveHref("/sleep", "/sleep-debt"), false);
    assert.equal(isActiveHref("/", "/"), true);
    assert.equal(isActiveHref("/", "/sleep"), false);
  });

  void it("finds the active page and its group", () => {
    const active = findActiveNav("/sleep-debt");
    assert.equal(active?.group?.id, "sleep");
    assert.equal(active?.item.label, "Sleep debt");
    assert.equal(findActiveNav("/sleep")?.item.href, "/sleep");
    assert.equal(findActiveNav("/day/2026-10-01")?.item.href, "/day");
    assert.equal(findActiveNav("/settings")?.group, null);
    assert.equal(findActiveNav("/nope"), null);
  });

  void it("lists every page exactly once", () => {
    const hrefs = [
      ...NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href)),
      ...SYSTEM_ITEMS.map((item) => item.href),
    ];
    assert.equal(new Set(hrefs).size, hrefs.length);
    for (const page of [
      "/day",
      "/",
      "/sleep",
      "/sleep-debt",
      "/sleep-consistency",
      "/steps",
      "/calories",
      "/resting-heart-rate",
      "/hrv",
      "/skin-temperature",
      "/weight",
      "/healthspan",
      "/recovery",
      "/habits",
      "/explore",
      "/data-sources",
      "/settings",
    ]) {
      assert.ok(hrefs.includes(page), `${page} is missing from the nav`);
    }
  });
});
