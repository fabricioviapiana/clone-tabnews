import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller";
import * as authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;

  const pgVersionQuery = await database.query("SHOW server_version;");
  const pgVersion = pgVersionQuery.rows[0].server_version;

  const pgMaxConnQuery = await database.query("SHOW max_connections;");
  const pgMaxConn = pgMaxConnQuery.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;
  const pgConnCountQuery = await database.query({
    text: "select count(*)::int from pg_stat_activity WHERE datname = $1",
    values: [databaseName],
  });
  const pgConnCount = pgConnCountQuery.rows[0].count;

  const updatedAt = new Date().toISOString();

  const statusResult = {
    updated_at: updatedAt,
    version: pgVersion,
    max_connections: parseInt(pgMaxConn),
    opened_connections: pgConnCount,
  };

  const secureOutputValue = authorization.filterOutput(
    userTryingToGet,
    "read:status",
    statusResult,
  );

  response.status(200).json(secureOutputValue);
}
