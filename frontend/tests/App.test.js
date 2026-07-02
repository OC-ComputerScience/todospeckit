import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import App from "../src/App.vue";

const vuetify = createVuetify({ components, directives });

describe("App.vue", () => {
  it("mounts the Vuetify application shell", () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
        stubs: {
          "router-view": true,
        },
      },
    });
    expect(wrapper.find(".v-application").exists()).toBe(true);
  });
});
