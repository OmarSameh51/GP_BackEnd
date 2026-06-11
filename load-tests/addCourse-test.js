import http from "k6/http";
import { check } from "k6";
import { SharedArray } from "k6/data";

const users = new SharedArray("users", function () {
  return open("./users.csv")
    .split("\n")
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const [email, password] = line.split(",");

      return {
        email: email.trim(),
        password: password.trim(),
      };
    });
});

const courses = [
  "HU111",
  "CS111",
  "IS231",
  "ST121",
  "PH111",
  "MA111",
  "CS112",
  "IT223",
  "ST122",
  "MA113",
];

export const options = {
  scenarios: {
    add_courses: {
      executor: "per-vu-iterations",
      vus: 100,
      iterations: 10,
      maxDuration: "10m",
    },
  },
};

export default function () {
  const user = users[__VU - 1];

  // Login
  const loginRes = http.post(
    "http://localhost:5000/api/auth/login",
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  check(loginRes, {
    "login success": (r) => r.status === 200,
  });

  const token = loginRes.json("token");

  // Course for this iteration
  const courseCode = courses[__ITER];

  const addCourseRes = http.post(
    "http://localhost:5000/api/user/course",
    JSON.stringify({
      courseCode,
      grade: 85,
      isPassed: true,
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (addCourseRes.status !== 200) {
    console.log(`${user.email} -> ${courseCode} -> ${addCourseRes.status}`);
    console.log(addCourseRes.body);
  }

  check(addCourseRes, {
    "add course success": (r) => r.status === 200,
  });
}
