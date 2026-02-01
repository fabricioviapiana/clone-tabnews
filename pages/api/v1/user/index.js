import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import * as user from "models/user.js";
import * as session from "models/session.js";
import { UnauthorizedError } from "infra/errors";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);

  if (!sessionObject) {
    throw new UnauthorizedError({
      message: "Usuário não possui sessão ativa",
      action: "Verifique se o usuário está logado e tente novamente",
    });
  }

  const userFound = await user.findOneById(sessionObject.user_id);
  const renewedToken = await session.renew(sessionObject.id);
  await controller.setSessionCookie(renewedToken.token, response);
  response.setHeader(
    "Cache-Control",
    "no-store, public, no-cache, must-revalidate",
  );
  return response.status(200).json(userFound);
}
