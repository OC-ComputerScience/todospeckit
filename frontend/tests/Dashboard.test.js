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

describe("Dashboard.vue sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  it("shows empty state when the user has no lists", async () => {
    listServices.getLists.mockResolvedValue({ data: [] });

    const wrapper = await mountDashboard();

    expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    expect(wrapper.text()).toContain("Select a list");
  });

  it("loads lists and selects the first list by default", async () => {
    listServices.getLists.mockResolvedValue({ data: [workList, personalList] });

    const wrapper = await mountDashboard();

    expect(wrapper.text()).toContain("Work");
    expect(wrapper.text()).toContain("Personal");
    expect(wrapper.text()).toContain("No todos in this list yet.");
    expect(todoServices.getTodos).toHaveBeenCalledWith(1);
    expect(wrapper.findAllComponents({ name: "VListItem" })[0].props("active")).toBe(true);
  });

  it("updates the main panel when a different list is selected", async () => {
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

  it("creates a list from the new list dialog", async () => {
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

  it("renames a list from the rename dialog", async () => {
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

  it("deletes a list after confirmation", async () => {
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

describe("Dashboard.vue create list dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  it("blocks create and shows validation when the list name is empty", async () => {
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

describe("Dashboard.vue main panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [workList, personalList] });
  });

  it("shows an empty todo state for a selected list with no todos", async () => {
    todoServices.getTodos.mockResolvedValue({ data: [] });

    const wrapper = await mountDashboard();

    expect(wrapper.text()).toContain("No todos in this list yet.");
  });

  it("loads the correct todos when switching lists", async () => {
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

describe("Dashboard.vue todo input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  it("disables add todo controls when no list is selected", async () => {
    listServices.getLists.mockResolvedValue({ data: [] });

    const wrapper = await mountDashboard();

    expect(getNewTodoField(wrapper).props("disabled")).toBe(true);
    expect(getAddButton(wrapper).attributes("disabled")).toBeDefined();
  });

  it("blocks add and shows validation when the todo title is empty", async () => {
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

  it("creates a todo in the selected list", async () => {
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

  it("creates a todo with a due date", async () => {
    listServices.getLists.mockResolvedValue({ data: [workList] });
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

describe("Dashboard.vue todo row", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [workList] });
    todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
  });

  it("toggles completed state from the checkbox", async () => {
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

  it("edits a todo from the edit dialog", async () => {
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

  it("sets a due date from the edit dialog", async () => {
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

  it("clears a due date from the edit dialog", async () => {
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

  it("shows overdue styling for incomplete past-due todos", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));

    todoServices.getTodos.mockResolvedValue({
      data: [{ ...milkTodo, dueDate: "2026-07-09" }],
    });

    const wrapper = await mountDashboard();

    expect(wrapper.find(".text-error").exists()).toBe(true);

    vi.useRealTimers();
  });

  it("does not show overdue styling for completed past-due todos", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T12:00:00"));

    todoServices.getTodos.mockResolvedValue({
      data: [{ ...milkTodo, dueDate: "2026-07-09", completed: true }],
    });

    const wrapper = await mountDashboard();

    expect(wrapper.find(".text-error").exists()).toBe(false);

    vi.useRealTimers();
  });

  it("deletes a todo after confirmation", async () => {
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
