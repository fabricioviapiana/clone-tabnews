export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte";
    this.statusCode = statusCode || 500; // Internal Server Error
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não permitido para este endpoint.");
    this.name = "MethodNotAllowedError";
    this.action = "Verifique se o método HTTP está correto";
    this.statusCode = 405; // Method Not Allowed
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message, action, context }) {
    super(message || "Serviço indisponível no momento.", {
      cause,
    });
    this.name = "ServiceError";
    this.action = action || "Verifique se o serviço está disponível";
    this.statusCode = 503; // Service Unavailable
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      context: this.context,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Um erro de validação ocorreu", {
      cause,
    });
    this.name = "ValidationError";
    this.action = action || "Ajuste os dados enviados e teste novamente";
    this.statusCode = 400; // Bad Request
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Não foi possível esse recuro no sistema", {
      cause,
    });
    this.name = "NotFoundError";
    this.action = action || "Verifique se os parâmetros estão corretos";
    this.statusCode = 404; // Not Found
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Usuário não autenticado", {
      cause,
    });
    this.name = "UnauthorizedError";
    this.action = action || "Faça novamente o login para continuar";
    this.statusCode = 401; // Unauthorized
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ForbiddenError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Acesso negado", {
      cause,
    });
    this.name = "ForbiddenError";
    this.action =
      action || "Verifique as features necessárias antes de continuar";
    this.statusCode = 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
