export function can(user, feature, resource) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }

  return authorized;
}

export function filterOutput(user, feature, resource) {
  if (feature === "read:user") {
    return {
      id: resource.id,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:user:self" && user.id === resource.id) {
    return {
      id: resource.id,
      email: resource.email,
      username: resource.username,
      features: resource.features,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }

  if (feature === "read:session" && user.id === resource.user_id) {
    return {
      id: resource.id,
      token: resource.token,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
    };
  }

  if (feature === "read:activation_token") {
    return {
      id: resource.id,
      token: resource.token,
      user_id: resource.user_id,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      expires_at: resource.expires_at,
      used_at: resource.used_at,
    };
  }

  if (feature === "read:migration") {
    return resource.map((migration) => ({
      path: migration.path,
      name: migration.name,
      timestamp: migration.timestamp,
    }));
  }

  if (feature === "read:status") {
    let result = {
      updated_at: resource.updated_at,
      max_connections: resource.max_connections,
      opened_connections: resource.opened_connections,
    };

    if (can(user, "read:status:all")) {
      result.version = resource.version;
    }

    return result;
  }
}
