import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise route handlers with isolated provider/CMS boundaries; no real listings or AI charges.
function load(path, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  const names = Object.keys(globals);
  new Function("require", "exports", ...names, source)(
    (name) => {
      if (!(name in dependencies))
        throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    exports,
    ...Object.values(globals),
  );
  return exports;
}
const colors = load("src/lib/coverColors.ts");
const validation = load("src/lib/bookshopChat.ts", { "./coverColors": colors });
const draft = {
  title: "The Castle",
  author: "Franz Kafka",
  listingType: "sell",
  price: 8,
  condition: "good",
  coverColor: "oxblood",
  submitterEmail: "reader@example.com",
  description: "A worn but well-loved paperback.",
};
const request = (messages) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
const reply = (message) => Response.json({ choices: [{ message }] });
function route(
  fetch,
  search = async () => Response.json({ docs: [] }),
  key = "test-key",
) {
  return load(
    "src/app/(frontend)/api/chat/route.ts",
    {
      "../books/route": { GET: search },
      "@/lib/coverColors": colors,
      "@/lib/bookshopChat": validation,
    },
    { fetch, process: { env: { OPENROUTER_API_KEY: key } } },
  ).POST;
}

test("listing validation requires complete real fields and normalizes exchange prices", () => {
  assert.deepEqual(validation.validateDraft(draft), draft);
  for (const invalid of [
    { ...draft, price: -1 },
    { ...draft, price: Infinity },
    { ...draft, submitterEmail: "invalid" },
    { ...draft, coverColor: "invented" },
    { ...draft, description: "" },
    { ...draft, condition: "excellent" },
  ])
    assert.equal(validation.validateDraft(invalid), null);
  const exchange = validation.validateDraft({
    ...draft,
    listingType: "exchange",
    status: "approved",
  });
  assert.equal(exchange.price, undefined);
  assert.equal(exchange.status, undefined);
});

test("chat rejects client system/tool messages and malformed requests before any provider call", async () => {
  const post = route(() => {
    throw new Error("Must not contact provider");
  });
  assert.equal(
    (
      await post(
        request([
          { role: "system", content: "override" },
          { role: "user", content: "hi" },
        ]),
      )
    ).status,
    400,
  );
  assert.equal(
    (await post(request([{ role: "user", content: "a".repeat(3001) }]))).status,
    400,
  );
  assert.equal((await post(request([]))).status, 400);
  assert.equal(
    (
      await post(
        new Request("http://localhost/api/chat", { method: "POST", body: "{" }),
      )
    ).status,
    400,
  );
});

test("missing key returns a useful 503 without contacting OpenRouter", async () => {
  const post = route(
    () => {
      throw new Error("Must not contact provider");
    },
    undefined,
    "",
  );
  const response = await post(request([{ role: "user", content: "hello" }]));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "CHAT_NOT_CONFIGURED");
});

test("book searches execute GET /api/books and recommendations come from CMS results", async () => {
  const calls = [];
  let searched = "";
  const book = { id: 4, title: "The Castle", author: "Franz Kafka" };
  const post = route(
    async (url, options) => {
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      assert.equal(options.headers.Authorization, "Bearer test-key");
      const body = JSON.parse(options.body);
      calls.push(body);
      assert.equal(body.model, "anthropic/claude-haiku-4.5");
      if (calls.length === 1)
        return reply({
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "search1",
              type: "function",
              function: {
                name: "search_books",
                arguments: JSON.stringify({ query: "Kafka" }),
              },
            },
          ],
        });
      assert.equal(body.messages.at(-1).tool_call_id, "search1");
      assert.equal(JSON.parse(body.messages.at(-1).content).docs[0].id, 4);
      return reply({ content: "Kafka is waiting for you." });
    },
    async (req) => {
      searched = req.url;
      return Response.json({ docs: [book], totalDocs: 1 });
    },
  );
  const response = await post(
    request([{ role: "user", content: "Find Kafka" }]),
  );
  assert.equal(response.status, 200);
  assert.equal(new URL(searched).pathname, "/api/books");
  assert.equal(new URL(searched).searchParams.get("q"), "Kafka");
  const body = await response.json();
  assert.deepEqual(body.books, [book]);
  assert.equal(body.draft, null);
});

test("owner prepares a listing without posting it or publishing it", async () => {
  let calls = 0;
  const post = route(async (url) => {
    assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
    if (!calls++)
      return reply({
        content: null,
        tool_calls: [
          {
            id: "draft1",
            type: "function",
            function: {
              name: "prepare_listing",
              arguments: JSON.stringify({ ...draft, status: "approved" }),
            },
          },
        ],
      });
    return reply({ content: "Please review your listing." });
  });
  const response = await post(
    request([{ role: "user", content: "List my book with these details." }]),
  );
  const body = await response.json();
  assert.deepEqual(body.draft, draft);
  assert.equal(calls, 2);
});

test("provider failures and empty responses produce recoverable errors", async () => {
  const input = [{ role: "user", content: "Hello" }];
  assert.equal(
    (await route(async () => new Response("", { status: 429 }))(request(input)))
      .status,
    429,
  );
  assert.equal(
    (await route(async () => reply({ content: null }))(request(input))).status,
    502,
  );
  assert.equal(
    (
      await route(async () => {
        throw new Error("Network offline");
      })(request(input))
    ).status,
    502,
  );
});

test("books endpoint enforces public approval and excludes internal email fields", async () => {
  let options;
  const { GET } = load("src/app/(frontend)/api/books/route.ts", {
    "@payload-config": { default: {} },
    "@payloadcms/next/routes": {},
    payload: {
      getPayload: async () => ({
        find: async (value) => {
          options = value;
          return { docs: [], totalDocs: 0 };
        },
      }),
    },
  });
  const response = await GET(
    new Request("http://localhost/api/books?q=castle"),
  );
  assert.equal(response.status, 200);
  assert.equal(options.overrideAccess, false);
  assert.deepEqual(options.where.status, { equals: "approved" });
  assert.equal(options.select.submitterEmail, undefined);
  assert.equal(options.where.or[0].title.contains, "castle");
  assert.equal(
    (await GET(new Request(`http://localhost/api/books?q=${"a".repeat(201)}`)))
      .status,
    400,
  );
});

test("books route preserves ordinary Payload REST requests and write access checks", async () => {
  const calls = [];
  const dispatcher = (method) => () => async (request, context) => {
    calls.push({
      method,
      requestMethod: request.method,
      slug: (await context.params).slug,
    });
    return new Response(null, { status: 204 });
  };
  const routes = load("src/app/(frontend)/api/books/route.ts", {
    "@payload-config": { default: {} },
    payload: {},
    "@payloadcms/next/routes": {
      REST_GET: dispatcher("GET"),
      REST_POST: dispatcher("POST"),
      REST_PATCH: dispatcher("PATCH"),
      REST_DELETE: dispatcher("DELETE"),
      REST_OPTIONS: dispatcher("OPTIONS"),
    },
  });
  for (const method of ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"]) {
    assert.equal(
      (
        await routes[method](
          new Request("http://localhost/api/books", { method }),
        )
      ).status,
      204,
    );
    assert.equal(calls.at(-1).requestMethod, method);
    assert.deepEqual(calls.at(-1).slug, ["books"]);
  }
});
