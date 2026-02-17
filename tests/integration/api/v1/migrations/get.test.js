import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se o usuário possui a feature read:migration",
        message: "Você não possui permissão para executar esta ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("Retrieving pending migrations", async () => {
      const userCreated = await orchestrator.createUser();
      await orchestrator.activateUser(userCreated.id);
      const session = await orchestrator.createSession(userCreated.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      expect(response.status).toBe(403);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: "Verifique se o usuário possui a feature read:migration",
        message: "Você não possui permissão para executar esta ação",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Priveleged user", () => {
    test("Retrieving pending migrations with `read:migraton`", async () => {
      const userCreated = await orchestrator.createUser();
      await orchestrator.activateUser(userCreated.id);
      await orchestrator.addFeaturesToUser(userCreated.id, ["read:migration"]);
      const session = await orchestrator.createSession(userCreated.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
