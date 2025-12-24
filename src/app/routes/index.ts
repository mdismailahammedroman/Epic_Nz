import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.route";
import { userRouter } from "../modules/user/user.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRouter,
  },
  {
    path: "/auth",
    route: AuthRouter,
  },
];

moduleRoutes.forEach((r) => {
  router.use(r.path, r.route);
});
