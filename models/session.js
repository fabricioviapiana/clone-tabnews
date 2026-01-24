import crypto from "node:crypto";
import database from "infra/database.js";

export const EXPIRATION_IN_MILLISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 days

export async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;

  async function runInsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

export async function findOneValidByToken(token) {
  const sessionFound = await runSelectQuery(token);
  return sessionFound;

  async function runSelectQuery(token) {
    const results = await database.query({
      text: `
        SELECT * FROM
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT 
          1;
      `,
      values: [token],
    });

    return results.rows[0];
  }
}

export async function renew(sessionId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const renewedSessionObject = await runUpdateQuery(sessionId, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING *;
      `,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}
