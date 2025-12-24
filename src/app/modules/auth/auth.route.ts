import { Router } from "express";
import { authController } from "./auth.controller";

const route = Router();

route.get("/logins", authController.login);
route.post("/login", authController.login);

export const AuthRouter = route;
