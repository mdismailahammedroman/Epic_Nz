import { Router } from "express";

export const router = Router();

const moduleRoutes = [
     {
      path: '/user',
      route: ;
     },
  //    {
  //     path: '/auth',
  //     route: authRouter
  //    }
 
];

moduleRoutes.forEach((r) => {
  router.use(r.path, r.route);
});
