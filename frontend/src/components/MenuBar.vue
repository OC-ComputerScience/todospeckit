<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const user = ref(Utils.getStore("user"));
const loggingOut = ref(false);

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const parts = [user.value.fName, user.value.lName].filter(Boolean);
  return parts.length ? parts.join(" ") : user.value.username;
});

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});

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
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>Todo Speckit</v-app-bar-title>

    <v-spacer />

    <span v-if="displayName" class="mr-4 text-body-1">{{ displayName }}</span>

    <v-btn
      variant="text"
      color="white"
      :loading="loggingOut"
      @click="handleSignOut"
    >
      Sign out
    </v-btn>
  </v-app-bar>
</template>
