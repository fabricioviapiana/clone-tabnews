import orchestrator from "tests/orchestrator.js";
import { version as uuidVersion } from "uuid";
import crypto from "node:crypto";
import activation from "models/activation.js";
import * as user from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

beforeEach(async () => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With non-existent token", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${crypto.randomUUID()}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrato no sistema ou expirou",
        action: "Faça um novo cadastro",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS * 2),
      });

      const createdUser = await orchestrator.createUser();

      const createdActivation =
        await orchestrator.createActivationToken(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrato no sistema ou expirou",
        action: "Faça um novo cadastro",
        status_code: 404,
      });
    });

    test("With already-used token", async () => {
      const createdUser = await orchestrator.createUser();

      const createdActivation =
        await orchestrator.createActivationToken(createdUser);

      const response1 = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response2.status).toBe(404);

      const responseBody = await response2.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrato no sistema ou expirou",
        action: "Faça um novo cadastro",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser();

      const createdActivation =
        await orchestrator.createActivationToken(createdUser);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${createdActivation.id}`,
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdActivation.id,
        used_at: responseBody.used_at,
        user_id: createdActivation.user_id,
        created_at: createdActivation.created_at.toISOString(),
        expires_at: createdActivation.expires_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(uuidVersion(createdActivation.id)).toBe(4);

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.used_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
      expect(responseBody.used_at > responseBody.created_at).toBe(true);

      const createdAt = new Date(responseBody.created_at).setMilliseconds(0);
      const expiresAt = new Date(responseBody.expires_at).setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(activation.EXPIRATION_IN_MILLISECONDS);

      const activatedUser = await user.findOneById(createdUser.id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const activationToken = await activation.create(createdUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não pode mais utilizar tokens de ativação",
        action: "Entre em contato com o suporte",
      });
    });
  });

  describe("Default user", () => {
    test("With valid token but already logged user", async () => {
      const createdUser1 = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser1.id);
      const sessionUser1 = await orchestrator.createSession(createdUser1.id);

      const createdUser2 = await orchestrator.createUser();
      const user2ActivationToken = await activation.create(createdUser2.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionUser1.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        status_code: 403,
        message: "Você não possui permissão para executar esta ação",
        action: "Verifique se o usuário possui a feature read:activation_token",
      });
    });
  });
});
