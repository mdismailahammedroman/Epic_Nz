import { Router } from "express";
import { AuthRouter } from "../modules/auth/auth.route";
import { userRouter } from "../modules/user/user.route";
import { locationRouter } from "../modules/location/location.routes";
import { weatherRouter } from "../modules/weather/weather.router";
import { SubscriptionRoute } from "../modules/subscription/subscription.router";

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
  {
    path: "/location",
    route: locationRouter,
  },
  {
    path: "/weather",
    route: weatherRouter,
  },
  {
    path: "/subscription",
    route: SubscriptionRoute,
  },
];

moduleRoutes.forEach((r) => {
  router.use(r.path, r.route);
});
