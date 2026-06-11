import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 100,
  duration: "30s",
};

export default function () {
  const payload = JSON.stringify({
    email: "seed1@test.com",
    password: "123456",
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

  check(res, {
    "login success": (r) => r.status === 200,
  });
}
