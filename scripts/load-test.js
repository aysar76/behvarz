// Load test for behvarz — growth to ~55k members (Phase 13).
//
// The real OTP/session flow requires SMS (dev provider only), so this test
// targets the read-heavy knowledge paths that dominate at scale, plus one
// health check. It is designed to run against a deployed instance.
//
// Run:
//   k6 run scripts/load-test.js
//
// Tune APP_BASE_URL and the VUs/stages via env:
//   K6_BASE_URL=https://behvarz.example.ir k6 run scripts/load-test.js

import { check, sleep } from "k6";
import http from "k6/http";

const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "1m", target: 20 }, // warm-up
    { duration: "5m", target: 100 }, // ramp to peak
    { duration: "5m", target: 100 }, // sustain
    { duration: "1m", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
  },
};

const USER_COUNT = 100;
const PHONES = Array.from(
  { length: USER_COUNT },
  (_, i) => `0912000${String(i).padStart(4, "0")}`,
);

function pick(phoneIndex) {
  return {
    phone: PHONES[phoneIndex],
    headers: { "Content-Type": "application/json" },
  };
}

// eslint-disable-next-line import/no-anonymous-default-export
export default function () {
  const user = pick(__VU - 1);

  // Health check (light)
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  // Read-heavy knowledge paths (the scaling bottleneck)
  const problems = http.get(`${BASE_URL}/api/problems`, {
    headers: user.headers,
  });
  check(problems, {
    "problems 200/401": (r) => r.status === 200 || r.status === 401,
  });

  const experiences = http.get(`${BASE_URL}/api/experiences`, {
    headers: user.headers,
  });
  check(experiences, {
    "experiences 200/401": (r) => r.status === 200 || r.status === 401,
  });

  const circles = http.get(`${BASE_URL}/api/circles`, {
    headers: user.headers,
  });
  check(circles, {
    "circles 200/401": (r) => r.status === 200 || r.status === 401,
  });

  const search = http.get(
    `${BASE_URL}/api/search?q=${encodeURIComponent("بهداشت")}&type=all`,
    { headers: user.headers },
  );
  check(search, {
    "search 200/401": (r) => r.status === 200 || r.status === 401,
  });

  // Small write path against OTP (rate limited per IP/phone; keep volume low)
  if (__ITER % 50 === 0) {
    const otp = http.post(
      `${BASE_URL}/api/auth/request-otp`,
      JSON.stringify({ phone: user.phone }),
      { headers: { "Content-Type": "application/json" } },
    );
    check(otp, { "otp 200/429": (r) => r.status === 200 || r.status === 429 });
  }

  sleep(1);
}
