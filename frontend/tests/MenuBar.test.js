import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { h } from "vue";
import { VApp } from "vuetify/components";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import authServices from "../src/services/authServices.js";
import { vuetify, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn().mockResolvedValue(undefined),
  },
}));

async function mountMenuBar() {
  const router = await createTestRouter("/");

  const wrapper = mount(
    {
      components: { VApp, MenuBar },
      render: () => h(VApp, null, { default: () => h(MenuBar) }),
    },
    {
      global: {
        plugins: [vuetify, router],
      },
    }
  );

  return wrapper;
}

describe("MenuBar.vue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows the signed-in user's name", async () => {
    Utils.setStore("user", {
      userId: 1,
      fName: "Jane",
      lName: "Doe",
      token: "test-token",
    });

    const wrapper = await mountMenuBar();

    expect(wrapper.text()).toContain("Jane Doe");
    expect(wrapper.text()).toContain("Sign out");
  });

  it("calls logout when Sign out is clicked", async () => {
    Utils.setStore("user", {
      userId: 1,
      fName: "Jane",
      token: "test-token",
    });

    const wrapper = await mountMenuBar();

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(authServices.logoutUser).toHaveBeenCalled();
  });
});
