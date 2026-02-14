import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import activation from "models/activation.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

async function patchHandler(request, response) {
  const activationTokenParam = request.query.token;

  const activatedTokenObject =
    await activation.markTokenAsUsed(activationTokenParam);

  await activation.activateUserById(activatedTokenObject.user_id);

  return response.status(200).json(activatedTokenObject);
}

export default router.handler(controller.errorHandlers);
