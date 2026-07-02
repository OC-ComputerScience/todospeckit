import { describe, it, expect, beforeEach } from "vitest";
import router from "../src/router.js";
import Utils from "../src/config/utils.js";

describe("router guards", () => {
  beforeEach(async () => {
    localStorage.clear();
    await router.push("/login");
    await router.isReady();
  });

  it("redirects unauthenticated users to login when accessing home", async () => {
    await router.push("/");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
  });

  it("redirects signed-in users away from login to home", async () => {
    Utils.setStore("user", {
      userId: 1,
      token: "test-token",
      fName: "Jane",
      username: "jdoe",
    });

    await router.push("/register");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("home");
  });
});
