import httpStatus from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import AppError from "../errorHelper/AppError";

const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(
      httpStatus.NOT_FOUND,
      `Route ${req.originalUrl} not found on this server`
    )
  );
};

export default notFound;
