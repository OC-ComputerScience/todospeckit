/**
 * Features 2, 3, 5 — Todo List Management, Todo List Item Management, Todo Due Date
 * Specs: features/feature-2-todo-list-management.md, features/feature-3-todo-list-item-management.md, features/feature-5-todo-due-date.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const workList = { id: 1, name: "Work", userId: 1 };
const personalList = { id: 2, name: "Personal", userId: 1 };

const workTodos = [
  {
    id: 10,
    listId: 1,
    title: "Email client",
    completed: false,
    userId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 11,
    listId: 1,
    title: "Write report",
    completed: false,
    userId: 1,
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];

const personalTodos = [
  {
    id: 20,
    listId: 2,
    title: "Call mom",
    completed: false,
    userId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const milkTodo = {
  id: 30,
  listId: 1,
  title: "Buy milk",
  completed: false,
  dueDate: null,
  userId: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function mountDashboard() {
  const { wrapper } = await mountWithPlugins(Dashboard);
  await flushPromises();
  return wrapper;
}

async function clickButton(wrapper, text) {
  const localButton = wrapper.findAll("button").find((button) => button.text() === text);

  if (localButton) {
    await localButton.trigger("click");
    return;
  }

  const globalButton = [...document.body.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === text
  );

  expect(globalButton).toBeDefined();
  globalButton.click();
}

function getAddButton(wrapper) {
  return wrapper.findAll("button").find((button) => button.text() === "Add");
}

function getNewTodoField(wrapper) {
  return wrapper
    .findAllComponents({ name: "VTextField" })
    .find((field) => field.props("label") === "New todo");
}

function getDueDateField(wrapper, label = "Due date") {
  return wrapper
    .findAllComponents({ name: "VTextField" })
    .find((field) => field.props("label") === label);
}

function getEditDialogDueDateField(wrapper) {
  const dueDateFields = wrapper
    .findAllComponents({ name: "VTextField" })
    .filter((field) => field.props("label") === "Due date");

  return dueDateFields[dueDateFields.length - 1];
}

function getAddTodoForm(wrapper) {
  return wrapper.findAllComponents({ name: "VForm" })[0];
}

function clickLastBodyButton(text) {
  const buttons = [...document.body.querySelectorAll("button")].filter(
    (button) => button.textContent?.trim() === text
  );

  expect(buttons.length).toBeGreaterThan(0);
  buttons[buttons.length - 1].click();
}

describe("Feature 2 — Dashboard (lists)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-2.2 — View my lists", () => {
    it("User has no lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
      expect(wrapper.text()).toContain("Select a list");
    });

    it("Dashboard loads with existing lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList, personalList] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.text()).toContain("No todos in this list yet.");
      expect(todoServices.getTodos).toHaveBeenCalledWith(1);
      expect(wrapper.findAllComponents({ name: "VListItem" })[0].props("active")).toBe(true);
    });
  });

  describe("US-2.3 — Select a list", () => {
    it("User selects a different list", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList, personalList] });

      const wrapper = await mountDashboard();
      const listItems = wrapper.findAllComponents({ name: "VListItem" });

      await listItems[1].trigger("click");
      await flushPromises();

      expect(listItems[1].props("active")).toBe(true);
      expect(wrapper.text()).toContain("Personal");
      expect(todoServices.getTodos).toHaveBeenCalledWith(2);
      expect(wrapper.text()).toContain("No todos in this list yet.");
    });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });
      listServices.createList.mockResolvedValue({
        data: { id: 3, name: "Groceries", userId: 1 },
      });

      const wrapper = await mountDashboard();

      await clickButton(wrapper, "+ New List");
      await flushPromises();

      const listNameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "List name");
      await listNameField.setValue("Groceries");
      await clickButton(wrapper, "Create");
      await flushPromises();

      expect(listServices.createList).toHaveBeenCalledWith("Groceries");
      expect(wrapper.text()).toContain("Groceries");
      expect(todoServices.getTodos).toHaveBeenCalledWith(3);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList] });
      listServices.updateList.mockResolvedValue({
        data: { id: 1, name: "Office", userId: 1 },
      });

      const wrapper = await mountDashboard();

      await wrapper.get('[aria-label="Rename list"]').trigger("click");
      await flushPromises();

      const renameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("modelValue") === "Work");
      await renameField.setValue("Office");
      await clickButton(wrapper, "Save");
      await flushPromises();

      expect(listServices.updateList).toHaveBeenCalledWith(1, "Office");
      expect(wrapper.text()).toContain("Office");
      expect(wrapper.text()).not.toContain("Work");
    });

    it("User deletes a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList, personalList] });
      listServices.deleteList.mockResolvedValue({});

      const wrapper = await mountDashboard();
      const deleteButtons = wrapper.findAll('[aria-label="Delete list"]');

      await deleteButtons[0].trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete");
      await flushPromises();

      expect(listServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.findAllComponents({ name: "VListItem" })[0].props("active")).toBe(true);
    });
  });
});

describe("Feature 2 — Dashboard (create list dialog)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a list with an empty name", async () => {
      const wrapper = await mountDashboard();

      await clickButton(wrapper, "+ New List");
      await flushPromises();

      const createForm = wrapper.findAllComponents({ name: "VForm" })[1];
      await clickButton(wrapper, "Create");
      await flushPromises();

      const validation = await createForm.vm.validate();

      expect(validation.valid).toBe(false);
      expect(document.body.textContent).toContain("List name is required.");
      expect(listServices.createList).not.toHaveBeenCalled();
    });
  });
});

describe("Feature 3 — Dashboard (main panel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [workList, personalList] });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("Selected list has no todos", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("No todos in this list yet.");
    });

    it("User switches lists", async () => {
      todoServices.getTodos.mockImplementation((listId) => {
        if (listId === 1) {
          return Promise.resolve({ data: workTodos });
        }

        if (listId === 2) {
          return Promise.resolve({ data: personalTodos });
        }

        return Promise.resolve({ data: [] });
      });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("Email client");
      expect(wrapper.text()).toContain("Write report");
      expect(wrapper.text()).not.toContain("Call mom");

      const listItems = wrapper.findAllComponents({ name: "VListItem" });
      await listItems[1].trigger("click");
      await flushPromises();

      expect(todoServices.getTodos).toHaveBeenCalledWith(2);
      expect(wrapper.text()).toContain("Call mom");
      expect(wrapper.text()).not.toContain("Email client");
      expect(wrapper.text()).not.toContain("Write report");
    });
  });
});

describe("Feature 3 — Dashboard (todo input)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo when no list is selected", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      const wrapper = await mountDashboard();

      expect(getNewTodoField(wrapper).props("disabled")).toBe(true);
      expect(getAddButton(wrapper).attributes("disabled")).toBeDefined();
    });

    it("User adds a todo with an empty title", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList] });

      const wrapper = await mountDashboard();
      const addForm = getAddTodoForm(wrapper);

      await addForm.trigger("submit");
      await flushPromises();

      const validation = await addForm.vm.validate();

      expect(validation.valid).toBe(false);
      expect(wrapper.text()).toContain("Todo title is required.");
      expect(todoServices.createTodo).not.toHaveBeenCalled();
    });

    it("User adds a todo to the selected list", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList] });
      todoServices.createTodo.mockResolvedValue({
        data: milkTodo,
      });

      const wrapper = await mountDashboard();

      await getNewTodoField(wrapper).setValue("Buy milk");
      await getAddTodoForm(wrapper).trigger("submit");
      await flushPromises();

      expect(todoServices.createTodo).toHaveBeenCalledWith(1, "Buy milk", undefined);
      expect(wrapper.text()).toContain("Buy milk");
    });
  });
});

describe("Feature 5 — Dashboard (todo input due date)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    todoServices.getTodos.mockResolvedValue({ data: [] });
    listServices.getLists.mockResolvedValue({ data: [workList] });
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      todoServices.createTodo.mockResolvedValue({
        data: { ...milkTodo, dueDate: "2026-07-15" },
      });

      const wrapper = await mountDashboard();

      await getNewTodoField(wrapper).setValue("Buy milk");
      await getDueDateField(wrapper).setValue("2026-07-15");
      await getAddTodoForm(wrapper).trigger("submit");
      await flushPromises();

      expect(todoServices.createTodo).toHaveBeenCalledWith(1, "Buy milk", "2026-07-15");
      expect(wrapper.text()).toContain("Due");
    });
  });
});

describe("Feature 3 — Dashboard (todo row)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [workList] });
    todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, completed: true },
      });

      const wrapper = await mountDashboard();
      const checkbox = wrapper.findComponent({ name: "VCheckboxBtn" });

      await checkbox.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, { completed: true });
      expect(wrapper.text()).toContain("Buy milk");
    });

    it("User marks a completed todo as incomplete", async () => {
      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, completed: true }],
      });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, completed: false },
      });

      const wrapper = await mountDashboard();
      const checkbox = wrapper.findComponent({ name: "VCheckboxBtn" });

      await checkbox.vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, { completed: false });
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, title: "Buy oat milk" },
      });

      const wrapper = await mountDashboard();

      await wrapper.get('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();

      const editField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "Todo title");
      await editField.setValue("Buy oat milk");
      clickLastBodyButton("Save");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(wrapper.text()).toContain("Buy oat milk");
      expect(wrapper.text()).not.toContain("Buy milk");
    });

    it("User deletes a todo", async () => {
      todoServices.deleteTodo.mockResolvedValue({});

      const wrapper = await mountDashboard();

      await wrapper.get('[aria-label="Delete todo"]').trigger("click");
      await flushPromises();
      clickLastBodyButton("Delete");
      await flushPromises();

      expect(todoServices.deleteTodo).toHaveBeenCalledWith(30);
      expect(wrapper.text()).not.toContain("Buy milk");
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, dueDate: "2026-07-20" },
      });

      const wrapper = await mountDashboard();

      await wrapper.get('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();

      await getEditDialogDueDateField(wrapper).setValue("2026-07-20");
      clickLastBodyButton("Save");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(wrapper.text()).toContain("Due");
    });

    it("User clears a due date when editing a todo", async () => {
      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: "2026-07-20" }],
      });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, dueDate: null },
      });

      const wrapper = await mountDashboard();

      await wrapper.get('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();

      await getEditDialogDueDateField(wrapper).setValue("");
      clickLastBodyButton("Save");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy milk",
        dueDate: null,
      });
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-10T12:00:00"));

      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: "2026-07-09" }],
      });

      const wrapper = await mountDashboard();

      expect(wrapper.find(".text-error").exists()).toBe(true);

      vi.useRealTimers();
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-10T12:00:00"));

      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: "2026-07-09", completed: true }],
      });

      const wrapper = await mountDashboard();

      expect(wrapper.find(".text-error").exists()).toBe(false);

      vi.useRealTimers();
    });
  });
});
