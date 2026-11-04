import { z } from "zod";
export const mealSchema = z.object({
  id: z.string(),
  date: z.iso.date(),
  slot: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
  name: z.string().trim().min(1).max(120),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
});
export type Meal = z.infer<typeof mealSchema>;
export const weightSchema = z.object({
  date: z.iso.date(),
  kg: z.number().min(20).max(400),
});
export const profileSchema = z.object({
  start: z.number().min(20).max(400),
  goal: z.number().min(20).max(400),
  height: z.number().min(80).max(250),
  age: z.union([z.literal(""), z.coerce.number().min(18).max(110)]),
  sex: z.enum(["", "female", "male", "unspecified"]),
  activity: z.enum(["", "low", "moderate", "high"]),
  target: z.union([z.literal(""), z.coerce.number().min(800).max(6000)]),
  units: z.enum(["kg", "lb"]),
  preferences: z.string().max(500),
  onboarded: z.boolean(),
});
export const stateSchema = z.object({
  profile: profileSchema,
  meals: z.array(mealSchema),
  weights: z.array(weightSchema),
});
export type State = z.infer<typeof stateSchema>;
export const initial: State = {
  profile: {
    start: 95,
    goal: 90,
    height: 177,
    age: "",
    sex: "",
    activity: "",
    target: "",
    units: "kg",
    preferences: "",
    onboarded: false,
  },
  meals: [],
  weights: [],
};
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function averages(weights: State["weights"]) {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((w) => {
    const end = Date.parse(w.date);
    const window = sorted.filter(
      (v) =>
        Date.parse(v.date) <= end && Date.parse(v.date) > end - 7 * 86400000,
    );
    return {
      ...w,
      average:
        Math.round(
          (window.reduce((s, v) => s + v.kg, 0) / window.length) * 100,
        ) / 100,
    };
  });
}
export function csv(rows: Record<string, unknown>[], headers: string[]) {
  return (
    "\uFEFF" +
    [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))]
      .map((row) =>
        row
          .map((v) => {
            let s = String(v);
            if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
            return '"' + s.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export function weeklySummary(state: State) {
  const cutoff = Date.parse(today()) - 6 * 86400000;
  const meals = state.meals.filter(
    (m) => Date.parse(m.date) >= cutoff && m.date <= today(),
  );
  const days = new Set(meals.map((m) => m.date)).size;
  const weights = averages(
    state.weights.filter(
      (w) => Date.parse(w.date) >= cutoff && w.date <= today(),
    ),
  );
  return `This week: ${meals.length} meals across ${days} logged days and ${weights.length} weigh-ins. ${weights.length > 1 ? `Your recorded weight changed by ${(weights.at(-1)!.kg - weights[0].kg).toFixed(1)} kg. Short-term changes may reflect water and digestion.` : "More consistent weigh-ins will help reveal a trend."} Build balanced meals with vegetables, protein and fibre. Keep portions sustainable; incomplete logs cannot establish a calorie deficit. This is general information, not medical advice.`;
}
