<script setup>
import { computed, ref } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const user = ref(Utils.getStore("user"));
const loggingOut = ref(false);

const firstName = computed(() => user.value?.fName || "User");

const handleSignOut = async () => {
  loggingOut.value = true;

  try {
    await authServices.logoutUser();
  } finally {
    loggingOut.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" md="6" class="text-center">
        <h1 class="text-h4 mb-6">Welcome, {{ firstName }}!</h1>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loggingOut"
          @click="handleSignOut"
        >
          Sign out
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
