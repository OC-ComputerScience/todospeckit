import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Home from "../src/views/Home.vue";
import Utils from "../src/config/utils.js";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Home.vue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows a welcome message with the user's first name", async () => {
    Utils.setStore("user", {
      userId: 1,
      fName: "Jane",
      token: "test-token",
    });

    const { wrapper } = await mountWithPlugins(Home, {
      router: await createTestRouter("/"),
    });

    expect(wrapper.text()).toContain("Welcome, Jane!");
    expect(wrapper.text()).toContain("Sign out");
  });

  it("calls logout when Sign out is clicked", async () => {
    Utils.setStore("user", {
      userId: 1,
      fName: "Jane",
      token: "test-token",
    });

    const { wrapper } = await mountWithPlugins(Home);

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(authServices.logoutUser).toHaveBeenCalled();
  });
});
