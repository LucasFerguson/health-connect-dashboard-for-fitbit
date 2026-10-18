import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { healthSourceLabel } from "./sourceLabels";

void describe("healthSourceLabel", () => {
  void it("names known apps and the phone's own Health Connect source", () => {
    assert.equal(healthSourceLabel("com.fitbit.FitbitMobile"), "Fitbit");
    assert.equal(healthSourceLabel("com.whoop.android"), "WHOOP");
    assert.equal(
      healthSourceLabel(
        "com.android.healthconnect.phone.ja8cc6aee389232d1b5a96cfc14a2e582",
      ),
      "Phone (Health Connect)",
    );
    assert.equal(healthSourceLabel("android"), "Android");
    assert.equal(healthSourceLabel("org.example.app"), "org.example.app");
  });
});
