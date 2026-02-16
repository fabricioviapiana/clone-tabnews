import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import * as user from "models/user.js";
import * as authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userName = request.query.username;
  const userFound = await user.findOneByUsername(userName);
  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const userName = request.query.username;
  const userInputValues = request.body;

  const userTryingToPatch = request.context.user;
  const targetUser = await user.findOneByUsername(userName);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action:
        "Verifique se você possui a feature necessário para atualizar outro usuário",
    });
  }

  const updatedUser = await user.update(userName, userInputValues);
  return response.status(200).json(updatedUser);
}
