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
  vus: 100,
  duration: "15s",
};
export default function () {
  const user = users[(__VU - 1) % users.length];

  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(
    "http://localhost:5000/api/auth/login",
    payload,
    params,
  );

  if (res.status !== 200) {
    console.log("================================");
    console.log("EMAIL:", user.email);
    console.log("STATUS:", res.status);
    console.log("BODY:", res.body);
    console.log("================================");
  }

  check(res, {
    "login success": (r) => r.status === 200,
  });
}
