import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as scan } from "../app/api/scan/route";
import { POST as coach } from "../app/api/coach/route";
import { initial } from "../lib/model";
function req(
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new NextRequest(`http://localhost:3000/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
test("scan rejects invalid image and oversized requests", async () => {
  assert.equal(
    (await scan(req("scan", { image: "file:///private" }))).status,
    400,
  );
  assert.equal(
    (await scan(req("scan", {}, { "content-length": "7000000" }))).status,
    413,
  );
});
test("keyless scan is explicitly demo and does not invent nutrition", async () => {
  const key = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const response = await scan(
      req("scan", { image: "data:image/png;base64,aGVsbG8=" }),
    );
    const data = await response.json();
    assert.equal(data.mode, "demo");
    assert.equal(data.meal.calories, 0);
  } finally {
    if (key) process.env.OPENAI_API_KEY = key;
  }
});
test("configured AI requires access token before making provider requests", async () => {
  const key = process.env.OPENAI_API_KEY,
    token = process.env.AI_ACCESS_TOKEN;
  process.env.OPENAI_API_KEY = "test-not-real";
  process.env.AI_ACCESS_TOKEN = "test-private";
  try {
    assert.equal(
      (await scan(req("scan", { image: "data:image/png;base64,aGVsbG8=" })))
        .status,
      401,
    );
    assert.equal((await coach(req("coach", initial))).status, 401);
  } finally {
    if (key) process.env.OPENAI_API_KEY = key;
    else delete process.env.OPENAI_API_KEY;
    if (token) process.env.AI_ACCESS_TOKEN = token;
    else delete process.env.AI_ACCESS_TOKEN;
  }
});
test("coach rejects invalid journal data", async () => {
  assert.equal((await coach(req("coach", {}))).status, 400);
});
