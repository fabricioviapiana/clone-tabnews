import retry from "async-retry";
import { faker } from "@faker-js/faker";
import database from "infra/database";
import * as migrator from "models/migrator.js";
import * as user from "models/user.js";
import * as session from "models/session";
import activation from "models/activation.js";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}/messages`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
      onRetry: (error, attempt) => {
        console.log(`Error ${error.message} occurred on attempt ${attempt}`);
      },
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (!response.ok) {
        throw new Error(`v1/status is not ok`);
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
      onRetry: (error, attempt) => {
        console.log(`Error ${error.message} occurred on attempt ${attempt}`);
      },
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);
      if (!response.ok) {
        throw new Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    ...userObject,
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || faker.internet.password(),
  });
}

async function createActivationToken(userObject) {
  return await activation.create(userObject.id);
}

async function activateUser(userId) {
  return await activation.activateUserByUserId(userId);
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(emailHttpUrl, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(emailHttpUrl);
  const emaiListBody = await emailListResponse.json();
  const lastEmailItem = emaiListBody.pop();

  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();

  return {
    ...lastEmailItem,
    text: emailTextBody,
  };
}

async function findActivationByUserId(userId) {
  const result = await runSelectQuery(userId);
  return result;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1
        LIMIT 1;`,
      values: [userId],
    });
    return results.rows[0];
  }
}

function extractUUID(text) {
  const regex = /[0-9a-fA-F-]{36}/;
  const match = text.match(regex);
  return match ? match[0] : null;
}

async function addFeaturesToUser(userId, features) {
  const updatedUser = await user.addFeatures(userId, features);
  return updatedUser;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  findActivationByUserId,
  extractUUID,
  activateUser,
  createActivationToken,
  addFeaturesToUser,
};

export default orchestrator;
