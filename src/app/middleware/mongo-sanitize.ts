import { NextFunction, Request, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";

const safeSanitizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only sanitize the body and params, not the query
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body); // Sanitize the body
  }

  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params); // Sanitize the params
  }

  next();
};

export default safeSanitizeMiddleware;
