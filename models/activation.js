import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
import { NotFoundError } from "infra/errors";
import * as user from "models/user.js";

/**
 * 15 MINUTES
 */
const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000;

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO 
        user_activation_tokens (user_id, expires_at) 
      VALUES 
        ($1,$2)
      RETURNING *;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Fintab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no Fintab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no Fintab!
    
${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe Fintab`,
  });
}

async function findOneByValidId(activationToken) {
  const result = await runSelectQuery(activationToken);
  return result;

  async function runSelectQuery(activationToken) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          and used_at IS NULL
        LIMIT 1;`,
      values: [activationToken],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrato no sistema ou expirou",
        action: "Faça um novo cadastro",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(activationToken) {
  const result = await runUpdateQuery(activationToken);
  return result;

  async function runUpdateQuery(activationToken) {
    const results = await database.query({
      text: `
        UPDATE 
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        RETURNING *`,
      values: [activationToken],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrato no sistema ou expirou",
        action: "Faça um novo cadastro",
      });
    }

    return results.rows[0];
  }
}

async function activateUserById(userId) {
  const activatedUser = await user.setFeatures(userId, ["create:session"]);
  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findOneByValidId,
  markTokenAsUsed,
  activateUserById,
};

export default activation;
