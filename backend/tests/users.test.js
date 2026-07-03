import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  resetTestDatabase,
  registerUser,
  updateProfile,
} from "./helpers.js";

const validProfile = {
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
};

describe("User API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("GET /todo/users/:id", () => {
    it("returns the caller's profile without a password hash", async () => {
      const user = await registerUser({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
      });

      const response = await request(app)
        .get(`/todo/users/${user.user.userId}`)
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("returns 404 when fetching another user's profile", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .get(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`User with id=${userB.user.userId} not found.`);
    });

    it("returns 401 without a token", async () => {
      const user = await registerUser();

      const response = await request(app).get(`/todo/users/${user.user.userId}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("PUT /todo/users/:id", () => {
    it("updates profile fields for the authenticated user", async () => {
      const user = await registerUser({
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "jdoe",
      });

      const response = await updateProfile(user.authHeader, user.user.userId, {
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("updates the password when a valid new password is provided", async () => {
      const user = await registerUser({
        email: "jane@example.com",
        username: "jdoe",
        password: "password123",
      });

      const response = await updateProfile(user.authHeader, user.user.userId, {
        ...validProfile,
        email: user.user.email,
        username: user.user.username,
        password: "newpassword123",
      });

      expect(response.status).toBe(200);

      const storedUser = await db.user.unscoped().findByPk(user.user.userId);
      const passwordMatch = await bcrypt.compare("newpassword123", storedUser.password);
      expect(passwordMatch).toBe(true);
    });

    it("returns 400 when the password is too short", async () => {
      const user = await registerUser({
        email: "jane@example.com",
        username: "jdoe",
      });

      const response = await updateProfile(user.authHeader, user.user.userId, {
        ...validProfile,
        email: user.user.email,
        username: user.user.username,
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at least 8 characters.");
    });

    it("returns 400 when required fields are missing", async () => {
      const user = await registerUser();

      const response = await updateProfile(user.authHeader, user.user.userId, {
        lName: "Doe",
        email: user.user.email,
        username: user.user.username,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("First name is required.");
    });

    it("returns 400 when the username is already taken", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await updateProfile(userA.authHeader, userA.user.userId, {
        fName: "Alice",
        lName: "Example",
        email: userA.user.email,
        username: "userb",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username is already taken.");

      const unchanged = await db.user.findByPk(userB.user.userId);
      expect(unchanged.username).toBe("userb");
    });

    it("returns 400 when the email is already registered", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await updateProfile(userA.authHeader, userA.user.userId, {
        fName: "Alice",
        lName: "Example",
        email: "b@example.com",
        username: userA.user.username,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is already registered.");

      const unchanged = await db.user.findByPk(userB.user.userId);
      expect(unchanged.email).toBe("b@example.com");
    });

    it("returns 401 without a token", async () => {
      const user = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.user.userId}`)
        .send(validProfile);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it("returns 404 when updating another user's profile and preserves the row", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
        fName: "Bob",
        lName: "Example",
      });

      const response = await updateProfile(userA.authHeader, userB.user.userId, {
        fName: "Hijacked",
        lName: "User",
        email: "hijacked@example.com",
        username: "hijacked",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`User with id=${userB.user.userId} not found.`);

      const unchanged = await db.user.findByPk(userB.user.userId);
      expect(unchanged.fName).toBe("Bob");
      expect(unchanged.username).toBe("userb");
    });
  });
});
