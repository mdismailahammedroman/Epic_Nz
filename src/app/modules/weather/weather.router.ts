import { checkAuth } from "./../../middleware/checkAuth.middleware";
import { Router } from "express";
import { weatherController } from "./weather.controller";
import { Role } from "../user/user.interface";

const router = Router();

router.get("/", checkAuth(Role.USER), weatherController.weatherInfo);
router.get(
  "/:id",
  checkAuth(Role.USER),
  weatherController.weatherInfoByLocationId
);
router.get(
  "/sunrise-sunset/:id",
  checkAuth(Role.USER),
  weatherController.weatherSunriseAndSunset
);

export const weatherRouter = router;
