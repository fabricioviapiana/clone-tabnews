import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import * as authentication from "models/authentication.js";
import * as authorization from "models/authorization.js";
import * as session from "models/session.js";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissãp para fazer login",
      action: "Contate o suporte",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  await controller.setSessionCookie(newSession.token, response);

  const secureOutputValues = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  return response.status(201).json(secureOutputValues);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;
  const userTryingToDelete = req.context.user;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireById(sessionObject.id);
  controller.clearSessionCookie(res);

  const secureOutputValues = authorization.filterOutput(
    userTryingToDelete,
    "read:session",
    expiredSession,
  );

  return res.status(200).json(secureOutputValues);
}

export default router.handler(controller.errorHandlers);
