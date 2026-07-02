import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

async function getForm(wrapper) {
  return wrapper.findComponent({ name: "VForm" });
}

async function getTextFields(wrapper) {
  return wrapper.findAllComponents({ name: "VTextField" });
}

async function submitLoginForm(wrapper) {
  const form = wrapper.findComponent({ name: "VForm" });
  await form.trigger("submit");
  await flushPromises();
}

describe("Login.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation when username is missing", async () => {
    const { wrapper } = await mountWithPlugins(Login);
    const form = await getForm(wrapper);

    await submitLoginForm(wrapper);
    const validation = await form.vm.validate();

    expect(validation.valid).toBe(false);
    expect(authServices.loginUser).not.toHaveBeenCalled();
  });

  it("shows validation when password is missing", async () => {
    const { wrapper } = await mountWithPlugins(Login);
    const fields = await getTextFields(wrapper);
    const form = await getForm(wrapper);

    await fields[0].setValue("jdoe");
    await submitLoginForm(wrapper);
    const validation = await form.vm.validate();

    expect(validation.valid).toBe(false);
    expect(authServices.loginUser).not.toHaveBeenCalled();
  });

  it("displays an API error when login fails", async () => {
    authServices.loginUser.mockRejectedValue({
      response: { data: { message: "Invalid username or password." } },
    });

    const { wrapper } = await mountWithPlugins(Login);
    const fields = await getTextFields(wrapper);

    await fields[0].vm.$emit("update:modelValue", "jdoe");
    await fields[1].vm.$emit("update:modelValue", "wrongpassword");
    await flushPromises();
    await submitLoginForm(wrapper);

    expect(authServices.loginUser).toHaveBeenCalledWith({
      username: "jdoe",
      password: "wrongpassword",
    });
    expect(wrapper.text()).toContain("Invalid username or password.");
  });
});
