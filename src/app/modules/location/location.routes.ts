// location.route.ts
import { locationController } from "./location.controller";
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import { multerUpload } from "../../config/multer.config";

const locationRouter = Router();

locationRouter.post(
  "/submit",
  checkAuth(Role.USER),
  multerUpload.single("image"), // <-- ADD THIS LINE
  locationController.submitLocation
);
locationRouter.get(
  "/all",
  checkAuth(Role.USER),
  locationController.getAllActivities
);
locationRouter.get("/hikes", checkAuth(Role.USER), locationController.getHikes);
export { locationRouter };
