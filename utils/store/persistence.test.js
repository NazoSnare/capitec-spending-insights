/** redux-persist: preferences survive a reload; nothing else is written. */
import { describe, expect, it } from "vitest";
import { makeStore, PERSIST_KEY } from "./index";
import { setPeriod, toggleHideAmounts } from "./preferencesSlice";

const flush = (persistor) => persistor.flush();

describe("persistence", () => {
  it("writes only the preferences to localStorage, and reads them back", async () => {
    localStorage.clear();
    const first = makeStore();
    await new Promise((r) => { if (first.persistor.getState().bootstrapped) r(); else first.persistor.subscribe(() => first.persistor.getState().bootstrapped && r()); });
    first.store.dispatch(setPeriod("90d"));
    first.store.dispatch(toggleHideAmounts());
    await flush(first.persistor);

    const saved = JSON.parse(localStorage.getItem(`persist:${PERSIST_KEY}`));
    expect(Object.keys(saved).sort()).toEqual(["_persist", "preferences"]);
    expect(JSON.parse(saved.preferences)).toMatchObject({ period: "90d", hideAmounts: true });

    const second = makeStore();
    await new Promise((r) => { if (second.persistor.getState().bootstrapped) r(); else second.persistor.subscribe(() => second.persistor.getState().bootstrapped && r()); });
    expect(second.store.getState().preferences).toMatchObject({ period: "90d", hideAmounts: true });
  });
});
