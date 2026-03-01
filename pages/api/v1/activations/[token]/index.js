import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";
import * as authorization from "models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.patch(controller.canRequest("read:activation_token"), patchHandler);

async function patchHandler(request, response) {
  const userTryingToPatch = request.context.user;
  const activationTokenParam = request.query.token;

  const validActivationCode =
    await activation.findOneByValidId(activationTokenParam);

  await activation.activateUserByUserId(validActivationCode.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenParam);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedActivationToken,
  );

  return response.status(200).json(secureOutputValues);
}

export default router.handler(controller.errorHandlers);
