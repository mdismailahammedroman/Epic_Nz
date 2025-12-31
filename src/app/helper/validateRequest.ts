import { ZodObject } from "zod";
import { NextFunction, Request, Response } from "express";

export const validateRequest = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // It should parse the data and update req.body/req.query
      const parsedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      // Update the request with parsed/coerced data
      req.body = parsedData.body;
      // req.body = parsedData.body as any;
      // req.query = parsedData.query as any;
      // req.params = parsedData.params as any;

      next();
    } catch (error) {
      next(error);
    }
  };
};
