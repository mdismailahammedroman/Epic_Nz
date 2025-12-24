import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.route";

export const router = Router();

const moduleRoutes = [
  //  {
  //   path: '/user',
  //   route: ;
  //  },
  {
    path: "/auth",
    route: AuthRouter,
  },
];

moduleRoutes.forEach((r) => {
  router.use(r.path, r.route);
});
