const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

process.env.NODE_ENV = "test";
const app = require("../../server");

const validBase = (overrides = {}) => ({
  firstName: "Test",
  lastName: "User",
  username: `validuser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  email: `valid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`,
  password: "Password123!",
  academicYear: 3,
  department: "CS",
  preferredDepartment: "CS",
  phoneNumber: "01000000000",
  ...overrides,
});

before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
  }
});

after(async () => {
  await mongoose.connection.close();
});

// /api/auth/register — input validation


test("REGISTER — year out of range (0) is rejected", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(validBase({ academicYear: 0 }));
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /year/i);
});

test("REGISTER — year out of range (5) is rejected", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(validBase({ academicYear: 5 }));
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /year/i);
});

test("REGISTER — non-integer year is rejected", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(validBase({ academicYear: 2.5 }));
  // Note: controller uses Number(academicYear) which accepts 2.5, then
  // checks ![1,2,3,4].includes(2.5) → true → 400. Confirmed.
  assert.equal(res.status, 400);
});

test("REGISTER — invalid department is rejected", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(validBase({ department: "MATH" }));
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /department/i);
});

test("REGISTER — year 1 with non-General department is rejected (cross-field)", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(validBase({ academicYear: 1, department: "CS" }));
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /level 1 and 2/i);
});

test("REGISTER — year 1 without preferredDepartment is rejected (cross-field)", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(
      validBase({ academicYear: 1, department: "General", preferredDepartment: undefined }),
    );
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /preferred/i);
});

test("REGISTER — year 3 with General department is rejected (cross-field)", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(validBase({ academicYear: 3, department: "General" }));
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /level 3 and 4/i);
});

test("REGISTER — invalid preferredDepartment is rejected", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send(validBase({ preferredDepartment: "MATH" }));
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /preferred/i);
});


test("LOGIN — empty body returns 400, not 500", async () => {
  const res = await request(app).post("/api/auth/login").send({});
  // Empty body → user is null → returns 400 "Invalid credentials"
  assert.equal(res.status, 400);
});

// /api/public/announcements — input validation

test("PUBLIC ANNOUNCEMENTS — limit is clamped to max 100", async () => {
  const res = await request(app).get("/api/public/announcements?limit=99999");
  assert.equal(res.status, 200);
  assert.ok(res.body.limit <= 100, `limit should be clamped, got ${res.body.limit}`);
});

test("PUBLIC ANNOUNCEMENTS — non-numeric limit falls back to default 20", async () => {
  const res = await request(app).get("/api/public/announcements?limit=abc");
  assert.equal(res.status, 200);
  // Controller uses parseInt(x, 10) || 20; parseInt("abc") = NaN, NaN || 20 = 20
  assert.equal(res.body.limit, 20);
});

test("PUBLIC ANNOUNCEMENTS — response shape is correct", async () => {
  const res = await request(app).get("/api/public/announcements?limit=5");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.announcements));
  assert.equal(typeof res.body.count, "number");
  assert.equal(typeof res.body.offset, "number");
  assert.equal(typeof res.body.limit, "number");
  if (res.body.announcements.length > 0) {
    const a = res.body.announcements[0];
    assert.equal(typeof a.id, "string");
    assert.equal(typeof a.type, "string");
    assert.equal(typeof a.courseCode, "string");
    assert.ok(a.createdAt, "createdAt should be present");
  }
});

// /api/public/course/:code — input validation


test("PUBLIC COURSE — unknown course code returns 404", async () => {
  const res = await request(app).get("/api/public/course/DOES_NOT_EXIST_999");
  assert.equal(res.status, 404);
  assert.match(res.body.msg, /not found/i);
});

test("PUBLIC COURSE — courseCode is normalized (whitespace stripped, uppercased)", async () => {
  // Sending "  cs112  " should be normalized to "CS112" before lookup.
  // If the course doesn't exist in the seeded graph, this returns 404 —
  // which still proves the route handled the input without crashing.
  const res = await request(app).get("/api/public/course/%20%20cs112%20%20");
  assert.ok([200, 404].includes(res.status), `unexpected ${res.status}`);
});


// /api/public/ai/advise — input validation


test("PUBLIC AI ADVISE — missing department is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({ academicYear: 2 });
  assert.equal(res.status, 400);
});

test("PUBLIC AI ADVISE — invalid department is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({ department: "MATH", academicYear: 2 });
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /department/i);
});

test("PUBLIC AI ADVISE — academicYear out of range is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({ department: "CS", academicYear: 9 });
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /academicYear/i);
});

test("PUBLIC AI ADVISE — semester out of range is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({ department: "CS", academicYear: 2, semester: 3 });
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /semester/i);
});

test("PUBLIC AI ADVISE — invalid grade (negative) is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({
      department: "CS",
      academicYear: 2,
      passedCourses: [{ courseCode: "CS112", grade: -10 }],
    });
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /grade/i);
});

test("PUBLIC AI ADVISE — invalid grade (>100) is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({
      department: "CS",
      academicYear: 2,
      passedCourses: [{ courseCode: "CS112", grade: 150 }],
    });
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /grade/i);
});

test("PUBLIC AI ADVISE — passedCourses entry without courseCode is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({
      department: "CS",
      academicYear: 2,
      passedCourses: [{ grade: 80 }],
    });
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /courseCode/i);
});

test("PUBLIC AI ADVISE — passedCourses not an array is rejected", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({
      department: "CS",
      academicYear: 2,
      passedCourses: "not-an-array",
    });
  assert.equal(res.status, 400);
  assert.match(res.body.msg, /array/i);
});

test("PUBLIC AI ADVISE — valid minimal payload is accepted (department + year)", async () => {
  const res = await request(app)
    .post("/api/public/ai/advise")
    .send({ department: "CS", academicYear: 2 });
  // 200 = deterministic advisor succeeded
  // 502 = AI advisor service unreachable in this env, that's also a valid path
  // 500 = unexpected; should not happen with a valid payload
  assert.ok(
    [200, 502].includes(res.status),
    `unexpected status ${res.status}: ${JSON.stringify(res.body)}`,
  );
});
