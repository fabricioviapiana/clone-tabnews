import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBe(
        new Date(responseBody.updated_at).toISOString(),
      );
      expect(responseBody.max_connections).toEqual(100);
      expect(responseBody.opened_connections).toEqual(1);
      expect(responseBody).not.toHaveProperty("version");
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const session = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBe(
        new Date(responseBody.updated_at).toISOString(),
      );
      expect(responseBody.max_connections).toEqual(100);
      expect(responseBody.opened_connections).toEqual(1);
      expect(responseBody).not.toHaveProperty("version");
    });
  });

  describe("Priveged user", () => {
    test("Retrieving current system status", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser.id, ["read:status:all"]);
      const session = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        updated_at: new Date(responseBody.updated_at).toISOString(),
        max_connections: 100,
        opened_connections: 1,
        version: "16.0",
      });
    });
  });
});
