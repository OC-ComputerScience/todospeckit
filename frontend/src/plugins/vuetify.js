import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { loadFonts } from "./webfontloader.js";

loadFonts();

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

const todoLightTheme = {
  dark: false,
  colors: {
    primary: "#1976D2",
    secondary: "#424242",
    success: "#4CAF50",
    error: "#FF5252",
    warning: "#FB8C00",
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "todoLightTheme",
    themes: { todoLightTheme },
  },
  icons: { defaultSet: "mdi" },
});

export default vuetify;
