import * as authorization from "models/authorization.js";
import { InternalServerError } from "infra/errors.js";

describe("models/authorization", () => {
  describe("can()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
        features: [],
      };
      expect(() => {
        authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid user and known `features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe("filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("with unknown `features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
        features: [],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid user, known `features`, and resource", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
        features: ["read:user"],
      };
      const resource = {
        id: 1,
        username: "Resource",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: "resource@resource.com",
        password: "resource",
      };
      const result = authorization.filterOutput(
        createdUser,
        "read:user",
        resource,
      );
      expect(result).toEqual({
        id: 1,
        username: "Resource",
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      });
    });

    test("with valid user, known `features`, but no resource", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
        features: ["read:user"],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });
  });
});
