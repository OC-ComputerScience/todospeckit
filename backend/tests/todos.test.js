import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  resetTestDatabase,
  registerUser,
  createList,
  createTodo,
} from "./helpers.js";

describe("Todo API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("GET /todo/lists/:listId/todos", () => {
    it("returns only the caller's todos for an owned list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const groceries = await createList(userA.authHeader, "Groceries");
      const secretList = await createList(userB.authHeader, "Secret");

      await createTodo(userA.authHeader, groceries.body.id, "Buy milk");
      await createTodo(userA.authHeader, groceries.body.id, "Buy eggs");
      await createTodo(userB.authHeader, secretList.body.id, "Hidden task");

      const completedTodo = await createTodo(userA.authHeader, groceries.body.id, "Done task");
      await request(app)
        .put(`/todo/todos/${completedTodo.body.id}`)
        .set(userA.authHeader)
        .send({ completed: true });

      const response = await request(app)
        .get(`/todo/lists/${groceries.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body.map((todo) => todo.title)).toEqual([
        "Buy milk",
        "Buy eggs",
        "Done task",
      ]);
      expect(response.body.every((todo) => todo.userId === userA.user.userId)).toBe(true);
      expect(response.body.filter((todo) => todo.completed)).toHaveLength(1);
      expect(response.body.filter((todo) => !todo.completed)).toHaveLength(2);
      expect(response.body.every((todo) => "dueDate" in todo)).toBe(true);
    });

    it("returns 404 for another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const secretList = await createList(userB.authHeader, "Secret");
      await createTodo(userB.authHeader, secretList.body.id, "Hidden task");

      const response = await request(app)
        .get(`/todo/lists/${secretList.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${secretList.body.id} not found.`);
    });

    it("returns 401 without a token", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await request(app).get(`/todo/lists/${list.body.id}/todos`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("POST /todo/lists/:listId/todos", () => {
    it("creates a todo in an owned list", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: "Buy milk",
        completed: false,
        listId: list.body.id,
        userId: user.user.userId,
      });
      expect(response.body.id).toBeDefined();
    });

    it("creates a todo with a due date", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(
        user.authHeader,
        list.body.id,
        "Buy milk",
        "2026-07-15"
      );

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
    });

    it("creates a todo without a due date", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeNull();
    });

    it("returns 400 when due date is invalid on create", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(user.authHeader)
        .send({ title: "Task", dueDate: "not-a-date" });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Due date/i);

      const todos = await db.todo.findAll({ where: { listId: list.body.id } });
      expect(todos).toHaveLength(0);
    });

    it("returns 400 when the todo title is empty", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");

      const response = await createTodo(user.authHeader, list.body.id, "   ");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Todo title is required.");
    });

    it("returns 404 when adding a todo to another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const secretList = await createList(userB.authHeader, "Secret");

      const response = await createTodo(userA.authHeader, secretList.body.id, "Intruder task");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${secretList.body.id} not found.`);

      const todos = await db.todo.findAll({ where: { listId: secretList.body.id } });
      expect(todos).toHaveLength(0);
    });

    it("ignores a spoofed userId in the request body", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userA.authHeader, "Groceries");

      const response = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(userA.authHeader)
        .send({ title: "Buy milk", userId: userB.user.userId });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);
      expect(response.body.userId).not.toBe(userB.user.userId);
    });
  });

  describe("PUT /todo/todos/:id", () => {
    it("updates a todo title", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ title: "Buy oat milk" });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Buy oat milk");
      expect(response.body.userId).toBe(user.user.userId);
    });

    it("toggles a todo completed state", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const completeResponse = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ completed: true });

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.completed).toBe(true);

      const incompleteResponse = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ completed: false });

      expect(incompleteResponse.status).toBe(200);
      expect(incompleteResponse.body.completed).toBe(false);
    });

    it("sets a due date on update", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: "2026-07-20" });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe("2026-07-20");
    });

    it("clears a due date on update", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(
        user.authHeader,
        list.body.id,
        "Buy milk",
        "2026-07-20"
      );

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: null });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
    });

    it("returns 400 when due date is invalid on update", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(
        user.authHeader,
        list.body.id,
        "Buy milk",
        "2026-07-20"
      );

      const response = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(user.authHeader)
        .send({ dueDate: "2026-99-99" });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Due date/i);

      const unchanged = await db.todo.findByPk(created.body.id);
      expect(unchanged.dueDate).toBe("2026-07-20");
    });

    it("returns 404 when setting due date on another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userB.authHeader, "Secret");
      const secretTodo = await createTodo(userB.authHeader, list.body.id, "Hidden task");

      const response = await request(app)
        .put(`/todo/todos/${secretTodo.body.id}`)
        .set(userA.authHeader)
        .send({ dueDate: "2026-07-15" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${secretTodo.body.id} not found.`);

      const unchanged = await db.todo.findByPk(secretTodo.body.id);
      expect(unchanged.dueDate).toBeNull();
    });

    it("returns 404 when updating another user's todo and preserves the row", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userB.authHeader, "Secret");
      const secretTodo = await createTodo(userB.authHeader, list.body.id, "Hidden task");

      const response = await request(app)
        .put(`/todo/todos/${secretTodo.body.id}`)
        .set(userA.authHeader)
        .send({ title: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${secretTodo.body.id} not found.`);

      const unchanged = await db.todo.findByPk(secretTodo.body.id);
      expect(unchanged.title).toBe("Hidden task");
    });
  });

  describe("DELETE /todo/todos/:id", () => {
    it("deletes a todo owned by the authenticated user", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const created = await createTodo(user.authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .delete(`/todo/todos/${created.body.id}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Todo deleted successfully.");

      const deleted = await db.todo.findByPk(created.body.id);
      expect(deleted).toBeNull();
    });

    it("returns 404 when deleting another user's todo and preserves the row", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const list = await createList(userB.authHeader, "Secret");
      const secretTodo = await createTodo(userB.authHeader, list.body.id, "Hidden task");

      const response = await request(app)
        .delete(`/todo/todos/${secretTodo.body.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${secretTodo.body.id} not found.`);

      const preserved = await db.todo.findByPk(secretTodo.body.id);
      expect(preserved).not.toBeNull();
      expect(preserved.title).toBe("Hidden task");
    });
  });

  describe("List delete cascade", () => {
    it("deletes child todos when a list is removed", async () => {
      const user = await registerUser();
      const list = await createList(user.authHeader, "Groceries");
      const milk = await createTodo(user.authHeader, list.body.id, "Buy milk");
      const eggs = await createTodo(user.authHeader, list.body.id, "Buy eggs");

      const response = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);

      const deletedList = await db.list.findByPk(list.body.id);
      expect(deletedList).toBeNull();

      const deletedMilk = await db.todo.findByPk(milk.body.id);
      const deletedEggs = await db.todo.findByPk(eggs.body.id);
      expect(deletedMilk).toBeNull();
      expect(deletedEggs).toBeNull();
    });
  });
});
