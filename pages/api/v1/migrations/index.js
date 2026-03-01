import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import * as migrator from "models/migrator.js";
import * as authorization from "models/authorization.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);

export default router.handler(controller.errorHandlers);

router.get(controller.canRequest("read:migration"), getHandler);

async function getHandler(request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();

  const useTryingToGet = request.context.user;

  const secureOutputValues = authorization.filterOutput(
    useTryingToGet,
    "read:migration",
    pendingMigrations,
  );

  return response.status(200).json(secureOutputValues);
}

router.post(controller.canRequest("create:migration"), postHandler);

async function postHandler(request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();

  const useTryingToPost = request.context.user;

  const secureOutputValues = authorization.filterOutput(
    useTryingToPost,
    "read:migration",
    migratedMigrations,
  );

  return response
    .status(migratedMigrations.length > 0 ? 201 : 200)
    .json(secureOutputValues);
}
