const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");

const {
  testUser,
  registerTestUser,
  getTestUserId,
  getTestUserAuthToken,
} = require("./testHelpers");

let testUserId;
let testUserAuthToken;

async function assignTestValues() {
  await registerTestUser();
  testUserId = getTestUserId();
  testUserAuthToken = getTestUserAuthToken();
}

describe("authRouter", () => {
  beforeAll(async () => {
    await DB.initializeDatabase();
    await assignTestValues();
  });

  test("register invalid", async () => {
    const responseRes = await request(app)
      .post("/api/auth")
      .send({ name: "test", email: "", password: "test" });
    expect(responseRes.status).toBe(400);
    expect(responseRes.body.message).toBe(
      "name, email, and password are required",
    );
  });

  test("login", async () => {
    const loginRes = await request(app).put("/api/auth").send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(
      /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/,
    );
    const { ...user } = { ...testUser, roles: [{ role: "diner" }] };
    delete user.password;
    expect(loginRes.body.user).toMatchObject(user);
    testUserId = loginRes.body.user.id;
  });

  test("logout", async () => {
    const logoutRes = await request(app)
      .delete("/api/auth")
      .set("Authorization", "Bearer " + testUserAuthToken);
    expect(logoutRes.status).toBe(200);
  });

  test("update user no token", async () => {
    const responseRes = await request(app)
      .put("/api/auth/" + testUserId)
      .send({ email: "test", password: "test" });
    expect(responseRes.status).toBe(401);
    expect(responseRes.body.message).toBe("unauthorized");
  });

  test("update user", async () => {
    await assignTestValues();
    const responseRes = await request(app)
      .put("/api/auth/" + testUserId)
      .set("Authorization", "Bearer " + testUserAuthToken)
      .send({ email: testUser.email, password: testUser.password });
    expect(responseRes.status).toBe(200);
    const { ...user } = { ...testUser, roles: [{ role: "diner" }] };
    delete user.password;
    expect(responseRes.body).toMatchObject(user);
  });

  test("update user wrong id", async () => {
    await assignTestValues();
    const responseRes = await request(app)
      .put("/api/auth/" + 1)
      .set("Authorization", "Bearer " + testUserAuthToken)
      .send({ email: testUser.email, password: testUser.password });
    expect(responseRes.status).toBe(403);
    expect(responseRes.body.message).toBe("unauthorized");
  });

  test("bad database", async () => {
    await DB.initializeDatabase(true);
  });

  afterAll(async () => {
    await DB.dropDatabase();
  });
});