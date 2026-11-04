import { initial, stateSchema, type State } from "./model";
// Replace this boundary with an authenticated, per-user Supabase adapter. Never expose service-role keys.
export interface Repository {
  load(): State;
  save(state: State): void;
}
export const localRepository: Repository = {
  load() {
    const raw = localStorage.getItem("leantrack-v1");
    if (!raw) return structuredClone(initial);
    return stateSchema.parse(JSON.parse(raw));
  },
  save(state) {
    localStorage.setItem(
      "leantrack-v1",
      JSON.stringify(stateSchema.parse(state)),
    );
  },
};
