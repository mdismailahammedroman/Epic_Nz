import mongoSanitize from "mongo-sanitize";
import { Request, Response, NextFunction } from "express";

// Middleware to sanitize user input (body, query, params) to prevent NoSQL injection
const safeSanitizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize request body
  req.body = mongoSanitize(req.body);

  // Sanitize query parameters
  req.query = mongoSanitize(req.query);

  // Sanitize URL parameters
  req.params = mongoSanitize(req.params);

  // Continue to the next middleware or route handler
  next();
};

export default safeSanitizeMiddleware;
