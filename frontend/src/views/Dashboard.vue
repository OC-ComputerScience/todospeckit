<script setup>
import { computed, onMounted, ref, watch } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";
import {
  formatDueDate,
  isTodoOverdue,
  optionalDueDateRules,
  toDateInputValue,
} from "../config/validation.js";

const lists = ref([]);
const selectedListId = ref(null);
const listsLoading = ref(false);
const listsError = ref("");

const todos = ref([]);
const todosLoading = ref(false);
const todosError = ref("");

const createDialogOpen = ref(false);
const renameDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const editTodoDialogOpen = ref(false);
const deleteTodoDialogOpen = ref(false);

const createForm = ref(null);
const renameForm = ref(null);
const addTodoForm = ref(null);
const editTodoForm = ref(null);

const newListName = ref("");
const renameListName = ref("");
const newTodoTitle = ref("");
const newTodoDueDate = ref("");
const editTodoTitle = ref("");
const editTodoDueDate = ref("");

const listToRename = ref(null);
const listToDelete = ref(null);
const todoToEdit = ref(null);
const todoToDelete = ref(null);

const createLoading = ref(false);
const renameLoading = ref(false);
const deleteLoading = ref(false);
const addTodoLoading = ref(false);
const editTodoLoading = ref(false);
const deleteTodoLoading = ref(false);
const dialogError = ref("");
const todoDialogError = ref("");

const listNameRules = [
  (value) => !!value?.trim() || "List name is required.",
  (value) => value.trim().length <= 100 || "List name must be 100 characters or fewer.",
];

const todoTitleRules = [
  (value) => !!value?.trim() || "Todo title is required.",
  (value) => value.trim().length <= 255 || "Todo title must be 255 characters or fewer.",
];

const dueDateRules = optionalDueDateRules;

const selectedList = computed(() =>
  lists.value.find((list) => list.id === selectedListId.value) ?? null
);

const sortTodos = (items) =>
  [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

const loadLists = async () => {
  listsLoading.value = true;
  listsError.value = "";

  try {
    const response = await listServices.getLists();
    lists.value = response.data;

    if (lists.value.length === 0) {
      selectedListId.value = null;
      return;
    }

    const stillSelected = lists.value.some((list) => list.id === selectedListId.value);
    if (!stillSelected) {
      selectedListId.value = lists.value[0].id;
    }
  } catch (error) {
    listsError.value = error.response?.data?.message || "Failed to load lists.";
  } finally {
    listsLoading.value = false;
  }
};

const loadTodos = async () => {
  if (!selectedListId.value) {
    todos.value = [];
    return;
  }

  todosLoading.value = true;
  todosError.value = "";

  try {
    const response = await todoServices.getTodos(selectedListId.value);
    todos.value = sortTodos(response.data);
  } catch (error) {
    todos.value = [];
    todosError.value = error.response?.data?.message || "Failed to load todos.";
  } finally {
    todosLoading.value = false;
  }
};

const selectList = (listId) => {
  selectedListId.value = listId;
};

const openCreateDialog = () => {
  dialogError.value = "";
  newListName.value = "";
  createDialogOpen.value = true;
};

const closeCreateDialog = () => {
  createDialogOpen.value = false;
  newListName.value = "";
  dialogError.value = "";
};

const handleCreateList = async () => {
  dialogError.value = "";
  const { valid } = await createForm.value.validate();

  if (!valid) {
    return;
  }

  createLoading.value = true;

  try {
    const response = await listServices.createList(newListName.value.trim());
    lists.value = [...lists.value, response.data].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    selectedListId.value = response.data.id;
    closeCreateDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to create list.";
  } finally {
    createLoading.value = false;
  }
};

const openRenameDialog = (list) => {
  dialogError.value = "";
  listToRename.value = list;
  renameListName.value = list.name;
  renameDialogOpen.value = true;
};

const closeRenameDialog = () => {
  renameDialogOpen.value = false;
  listToRename.value = null;
  renameListName.value = "";
  dialogError.value = "";
};

const handleRenameList = async () => {
  dialogError.value = "";
  const { valid } = await renameForm.value.validate();

  if (!valid || !listToRename.value) {
    return;
  }

  renameLoading.value = true;

  try {
    const response = await listServices.updateList(
      listToRename.value.id,
      renameListName.value.trim()
    );
    lists.value = lists.value
      .map((list) => (list.id === response.data.id ? response.data : list))
      .sort((a, b) => a.name.localeCompare(b.name));
    closeRenameDialog();
  } catch (error) {
    dialogError.value = error.response?.data?.message || "Failed to rename list.";
  } finally {
    renameLoading.value = false;
  }
};

const openDeleteDialog = (list) => {
  listToDelete.value = list;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  listToDelete.value = null;
};

const handleDeleteList = async () => {
  if (!listToDelete.value) {
    return;
  }

  deleteLoading.value = true;

  try {
    await listServices.deleteList(listToDelete.value.id);
    lists.value = lists.value.filter((list) => list.id !== listToDelete.value.id);

    if (selectedListId.value === listToDelete.value.id) {
      selectedListId.value = lists.value[0]?.id ?? null;
    }

    closeDeleteDialog();
  } catch (error) {
    listsError.value = error.response?.data?.message || "Failed to delete list.";
    closeDeleteDialog();
  } finally {
    deleteLoading.value = false;
  }
};

const handleAddTodo = async () => {
  if (!selectedListId.value) {
    return;
  }

  todosError.value = "";
  const { valid } = await addTodoForm.value.validate();

  if (!valid) {
    return;
  }

  addTodoLoading.value = true;

  try {
    const response = await todoServices.createTodo(
      selectedListId.value,
      newTodoTitle.value.trim(),
      newTodoDueDate.value || undefined
    );
    todos.value = sortTodos([...todos.value, response.data]);
    newTodoTitle.value = "";
    newTodoDueDate.value = "";
    addTodoForm.value.reset();
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to create todo.";
  } finally {
    addTodoLoading.value = false;
  }
};

const handleToggleComplete = async (todo, completed) => {
  todosError.value = "";

  try {
    const response = await todoServices.updateTodo(todo.id, { completed });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === todo.id ? response.data : item))
    );
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to update todo.";
  }
};

const openEditTodoDialog = (todo) => {
  todoDialogError.value = "";
  todoToEdit.value = todo;
  editTodoTitle.value = todo.title;
  editTodoDueDate.value = toDateInputValue(todo.dueDate);
  editTodoDialogOpen.value = true;
};

const closeEditTodoDialog = () => {
  editTodoDialogOpen.value = false;
  todoToEdit.value = null;
  editTodoTitle.value = "";
  editTodoDueDate.value = "";
  todoDialogError.value = "";
};

const handleEditTodo = async () => {
  todoDialogError.value = "";
  const { valid } = await editTodoForm.value.validate();

  if (!valid || !todoToEdit.value) {
    return;
  }

  editTodoLoading.value = true;

  try {
    const response = await todoServices.updateTodo(todoToEdit.value.id, {
      title: editTodoTitle.value.trim(),
      dueDate: editTodoDueDate.value || null,
    });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === todoToEdit.value.id ? response.data : item))
    );
    closeEditTodoDialog();
  } catch (error) {
    todoDialogError.value = error.response?.data?.message || "Failed to update todo.";
  } finally {
    editTodoLoading.value = false;
  }
};

const openDeleteTodoDialog = (todo) => {
  todoToDelete.value = todo;
  deleteTodoDialogOpen.value = true;
};

const closeDeleteTodoDialog = () => {
  deleteTodoDialogOpen.value = false;
  todoToDelete.value = null;
};

const handleDeleteTodo = async () => {
  if (!todoToDelete.value) {
    return;
  }

  deleteTodoLoading.value = true;

  try {
    await todoServices.deleteTodo(todoToDelete.value.id);
    todos.value = todos.value.filter((todo) => todo.id !== todoToDelete.value.id);
    closeDeleteTodoDialog();
  } catch (error) {
    todosError.value = error.response?.data?.message || "Failed to delete todo.";
    closeDeleteTodoDialog();
  } finally {
    deleteTodoLoading.value = false;
  }
};

watch(selectedListId, (listId) => {
  newTodoTitle.value = "";
  newTodoDueDate.value = "";

  if (listId) {
    loadTodos();
  } else {
    todos.value = [];
    todosError.value = "";
    todosLoading.value = false;
  }
});

onMounted(() => {
  loadLists();
});
</script>

<template>
  <v-container fluid class="py-6">
    <v-alert v-if="listsError" type="error" density="compact" class="mb-4">
      {{ listsError }}
    </v-alert>

    <v-progress-linear v-if="listsLoading" indeterminate color="primary" class="mb-4" />

    <v-row>
      <v-col cols="12" md="4">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>My Lists</span>
            <v-btn
              color="primary"
              variant="elevated"
              size="small"
              :disabled="listsLoading"
              @click="openCreateDialog"
            >
              + New List
            </v-btn>
          </v-card-title>

          <v-card-text>
            <p v-if="!listsLoading && lists.length === 0" class="text-body-2 text-medium-emphasis">
              No lists yet. Create your first list.
            </p>

            <v-list v-else density="comfortable" class="pa-0">
              <v-list-item
                v-for="list in lists"
                :key="list.id"
                :title="list.name"
                :active="list.id === selectedListId"
                color="primary"
                rounded
                @click="selectList(list.id)"
              >
                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    aria-label="Rename list"
                    @click.stop="openRenameDialog(list)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    aria-label="Delete list"
                    @click.stop="openDeleteDialog(list)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card elevation="2" min-height="280">
          <v-card-title>
            {{ selectedList ? selectedList.name : "Select a list" }}
          </v-card-title>

          <v-card-text>
            <v-alert v-if="todosError" type="error" density="compact" class="mb-4">
              {{ todosError }}
            </v-alert>

            <v-progress-linear
              v-if="todosLoading"
              indeterminate
              color="primary"
              class="mb-4"
            />

            <v-form ref="addTodoForm" @submit.prevent="handleAddTodo">
              <div class="d-flex align-start ga-2 mb-4 flex-wrap">
                <v-text-field
                  v-model="newTodoTitle"
                  label="New todo"
                  density="comfortable"
                  :rules="todoTitleRules"
                  :disabled="!selectedList || todosLoading"
                  hide-details="auto"
                  class="flex-grow-1"
                  style="min-width: 12rem"
                />
                <v-text-field
                  v-model="newTodoDueDate"
                  label="Due date"
                  type="date"
                  density="comfortable"
                  :rules="dueDateRules"
                  :disabled="!selectedList || todosLoading"
                  hide-details="auto"
                  style="max-width: 11rem"
                />
                <v-btn
                  color="primary"
                  variant="elevated"
                  type="submit"
                  :disabled="!selectedList || todosLoading"
                  :loading="addTodoLoading"
                >
                  Add
                </v-btn>
              </div>
            </v-form>

            <p
              v-if="selectedList && !todosLoading && todos.length === 0"
              class="text-body-2 text-medium-emphasis"
            >
              No todos in this list yet.
            </p>

            <v-list
              v-else-if="selectedList && todos.length > 0"
              density="comfortable"
              class="pa-0"
            >
              <v-list-item v-for="todo in todos" :key="todo.id">
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="todo.completed"
                    color="primary"
                    @update:model-value="(value) => handleToggleComplete(todo, value)"
                  />
                </template>

                <v-list-item-title
                  :class="{
                    'text-decoration-line-through text-medium-emphasis': todo.completed,
                  }"
                >
                  {{ todo.title }}
                </v-list-item-title>

                <v-list-item-subtitle v-if="todo.dueDate">
                  <span :class="{ 'text-error': isTodoOverdue(todo) }">
                    Due {{ formatDueDate(todo.dueDate) }}
                  </span>
                </v-list-item-subtitle>

                <template #append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    aria-label="Edit todo"
                    @click="openEditTodoDialog(todo)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    aria-label="Delete todo"
                    @click="openDeleteTodoDialog(todo)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="createDialogOpen" max-width="480">
      <v-card>
        <v-card-title>New list</v-card-title>
        <v-card-text>
          <v-form ref="createForm" @submit.prevent="handleCreateList">
            <v-text-field
              v-model="newListName"
              label="List name"
              density="comfortable"
              :rules="listNameRules"
              autofocus
            />
            <v-alert
              v-if="dialogError"
              type="error"
              density="compact"
              class="mt-2"
            >
              {{ dialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeCreateDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="createLoading"
            @click="handleCreateList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Rename list</v-card-title>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="handleRenameList">
            <v-text-field
              v-model="renameListName"
              label="List name"
              density="comfortable"
              :rules="listNameRules"
              autofocus
            />
            <v-alert
              v-if="dialogError"
              type="error"
              density="compact"
              class="mt-2"
            >
              {{ dialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeRenameDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="renameLoading"
            @click="handleRenameList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete list</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ listToDelete?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteLoading"
            @click="handleDeleteList"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Edit todo</v-card-title>
        <v-card-text>
          <v-form ref="editTodoForm" @submit.prevent="handleEditTodo">
            <v-text-field
              v-model="editTodoTitle"
              label="Todo title"
              density="comfortable"
              :rules="todoTitleRules"
              autofocus
            />
            <v-text-field
              v-model="editTodoDueDate"
              label="Due date"
              type="date"
              density="comfortable"
              :rules="dueDateRules"
              clearable
            />
            <v-alert
              v-if="todoDialogError"
              type="error"
              density="compact"
              class="mt-2"
            >
              {{ todoDialogError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditTodoDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="editTodoLoading"
            @click="handleEditTodo"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTodoDialogOpen" max-width="480">
      <v-card>
        <v-card-title>Delete todo</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ todoToDelete?.title }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteTodoDialog">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteTodoLoading"
            @click="handleDeleteTodo"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
