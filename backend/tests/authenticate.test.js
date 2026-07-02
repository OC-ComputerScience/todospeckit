import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

describe("authenticate middleware", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("allows requests with a valid session token", async () => {
    const user = await registerUser();

    const response = await request(app)
      .post("/todo/logout")
      .set(user.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Signed out successfully.");
  });

  it("returns 401 when no token is provided", async () => {
    const response = await request(app).post("/todo/logout");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized! No token provided.");
  });

  it("returns 401 when the session token is expired", async () => {
    const user = await registerUser();

    await db.session.update(
      { expirationDate: new Date(Date.now() - 1000) },
      { where: { token: user.token } }
    );

    const response = await request(app)
      .post("/todo/logout")
      .set(user.authHeader);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized! Invalid or expired token.");
  });

  it("returns 401 when the session token has been revoked", async () => {
    const user = await registerUser();

    await db.session.update({ token: "" }, { where: { token: user.token } });

    const response = await request(app)
      .post("/todo/logout")
      .set(user.authHeader);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized! Invalid or expired token.");
  });

  it("sets req.user.id from the session for downstream handlers", async () => {
    const userA = await registerUser({
      email: "a@example.com",
      username: "usera",
    });
    await registerUser({
      email: "b@example.com",
      username: "userb",
    });

    const response = await request(app)
      .get("/todo/lists")
      .set(userA.authHeader);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
