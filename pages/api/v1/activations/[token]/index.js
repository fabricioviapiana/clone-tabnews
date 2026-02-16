import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

async function patchHandler(request, response) {
  const activationTokenParam = request.query.token;

  const validActivationCode =
    await activation.findOneByValidId(activationTokenParam);

  await activation.activateUserByUserId(validActivationCode.user_id);

  const usedActivationToken =
    await activation.markTokenAsUsed(activationTokenParam);

  return response.status(200).json(usedActivationToken);
}

export default router.handler(controller.errorHandlers);
