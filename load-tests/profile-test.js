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

export const options = {
  vus: 50,
  duration: "15s",
};

export default function () {
  const user = users[(__VU - 1) % users.length];

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

  if (loginRes.status !== 200) {
    return;
  }

  const token = loginRes.json("token");

  // Profile
  const profileRes = http.get("http://localhost:5000/api/user/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  check(profileRes, {
    "profile success": (r) => r.status === 200,
  });
}
