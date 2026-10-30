import { describe, it, expect, vi } from "vitest";
import { reloadIfRestoredFromCache } from "./bfcache";

describe("reloadIfRestoredFromCache", () => {
  it("recharge une page restaurée depuis le cache précédent/suivant", () => {
    const reload = vi.fn();

    reloadIfRestoredFromCache({ persisted: true }, reload);

    expect(reload).toHaveBeenCalledOnce();
  });

  it("ne recharge pas une page chargée normalement", () => {
    const reload = vi.fn();

    reloadIfRestoredFromCache({ persisted: false }, reload);

    expect(reload).not.toHaveBeenCalled();
  });
});
