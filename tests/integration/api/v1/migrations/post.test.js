import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        expect(response.status).toBe(403);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          action: "Verifique se o usuário possui a feature create:migration",
          message: "Você não possui permissão para executar esta ação",
          name: "ForbiddenError",
          status_code: 403,
        });
      });
    });
  });

  describe("Default user", () => {
    describe("Running pending migrations", () => {
      test("User Logged without `create:migrations", async () => {
        const userCreated = await orchestrator.createUser();
        await orchestrator.activateUser(userCreated.id);
        const session = await orchestrator.createSession(userCreated.id);

        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${session.token}`,
            },
          },
        );
        expect(response.status).toBe(403);
        const responseBody = await response.json();

        expect(responseBody).toEqual({
          action: "Verifique se o usuário possui a feature create:migration",
          message: "Você não possui permissão para executar esta ação",
          name: "ForbiddenError",
          status_code: 403,
        });
      });
    });
  });

  describe("Priveleged user", () => {
    describe("Running pending migrations", () => {
      test("User with `create:migrations`", async () => {
        const userCreated = await orchestrator.createUser();
        await orchestrator.activateUser(userCreated.id);
        await orchestrator.addFeaturesToUser(userCreated.id, [
          "create:migration",
        ]);
        const session = await orchestrator.createSession(userCreated.id);

        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${session.token}`,
            },
          },
        );
        expect(response.status).toBe(200);

        const responseBody = await response.json();

        expect(Array.isArray(responseBody)).toBe(true);
      });
    });
  });
});
