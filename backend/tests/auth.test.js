import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const validRegistration = {
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "password123",
};

describe("Auth API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("POST /todo/register", () => {
    it("registers a user and returns a session payload", async () => {
      const response = await request(app).post("/todo/register").send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jane@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
        token: expect.any(String),
      });

      const userRecord = await db.user.unscoped().findByPk(response.body.userId);
      expect(userRecord).not.toBeNull();
      expect(await bcrypt.compare("password123", userRecord.password)).toBe(true);

      const sessionCount = await db.session.count({
        where: { userId: response.body.userId, token: response.body.token },
      });
      expect(sessionCount).toBe(1);
    });

    it("returns 400 when required fields are missing", async () => {
      const response = await request(app).post("/todo/register").send({
        fName: "Jane",
        lName: "Doe",
        username: "jdoe",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is required.");
    });

    it("returns 400 when the password is too short", async () => {
      const response = await request(app)
        .post("/todo/register")
        .send({ ...validRegistration, password: "short" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at least 8 characters.");
    });

    it("returns 400 when the username is already taken", async () => {
      await request(app).post("/todo/register").send(validRegistration);

      const response = await request(app)
        .post("/todo/register")
        .send({
          ...validRegistration,
          email: "other@example.com",
          username: "jdoe",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username is already taken.");
    });

    it("returns 400 when the email is already registered", async () => {
      await request(app).post("/todo/register").send(validRegistration);

      const response = await request(app)
        .post("/todo/register")
        .send({
          ...validRegistration,
          email: "jane@example.com",
          username: "otheruser",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is already registered.");
    });
  });

  describe("POST /todo/login", () => {
    beforeEach(async () => {
      await request(app).post("/todo/register").send(validRegistration);
    });

    it("returns 200 with a session payload for valid credentials", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jane@example.com",
        role: "worker",
        token: expect.any(String),
      });
    });

    it("returns 401 for an invalid password", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe", password: "wrongpassword" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid username or password.");
    });

    it("returns 400 when username is missing", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username is required.");
    });

    it("returns 400 when password is missing", async () => {
      const response = await request(app)
        .post("/todo/login")
        .send({ username: "jdoe" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password is required.");
    });
  });

  describe("POST /todo/logout", () => {
    it("invalidates the current session token", async () => {
      const user = await registerUser(validRegistration);

      const response = await request(app)
        .post("/todo/logout")
        .set(user.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Signed out successfully.");

      const revokedSession = await db.session.findOne({
        where: { userId: user.user.userId },
      });
      expect(revokedSession.token).toBe("");

      const retry = await request(app)
        .post("/todo/logout")
        .set(user.authHeader);

      expect(retry.status).toBe(401);
    });

    it("returns 401 when no token is provided", async () => {
      const response = await request(app).post("/todo/logout");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized! No token provided.");
    });
  });
});
