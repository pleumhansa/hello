import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  mealSchema,
  profileSchema,
  weightSchema,
  averages,
  csv,
  weeklySummary,
} from "../lib/model";
test("initial profile has no invented logs or targets", () => {
  assert.equal(initial.profile.start, 95);
  assert.equal(initial.profile.height, 177);
  assert.equal(initial.profile.goal, 90);
  assert.equal(initial.profile.age, "");
  assert.equal(initial.profile.target, "");
  assert.equal(initial.meals.length, 0);
  assert.equal(initial.weights.length, 0);
});
test("reject invalid health values", () => {
  assert.equal(
    weightSchema.safeParse({ date: "2026-02-30", kg: 90 }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...initial.profile, age: 12 }).success,
    false,
  );
  assert.equal(
    mealSchema.safeParse({
      id: "1",
      date: "2026-01-01",
      slot: "lunch",
      name: "",
      calories: -1,
      protein: 0,
      carbs: 0,
      fat: 0,
    }).success,
    false,
  );
});
test("moving average uses calendar days, excluding older samples", () => {
  const result = averages([
    { date: "2026-01-01", kg: 100 },
    { date: "2026-01-07", kg: 94 },
    { date: "2026-01-08", kg: 92 },
  ]);
  assert.equal(result[1].average, 97);
  assert.equal(result[2].average, 93);
});
test("CSV preserves Thai, quotes, and neutralizes spreadsheet formula injection", () => {
  const out = csv([{ name: 'ข้าว,"ไก่"', value: "=1+1" }], ["name", "value"]);
  assert.ok(out.includes('ข้าว,""ไก่""'));
  assert.ok(out.includes("'=1+1"));
  assert.ok(out.startsWith("\uFEFF"));
});
test("fallback does not invent a deficit", () => {
  assert.match(weeklySummary(initial), /0 meals/);
  assert.match(weeklySummary(initial), /cannot establish a calorie deficit/);
});
