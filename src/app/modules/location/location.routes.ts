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
locationRouter.get(
  "/campgrounds",
  checkAuth(Role.USER),
  locationController.getCampgrounds
);
locationRouter.get(
  "/freedom-camping-locations",
  checkAuth(Role.USER),
  locationController.getFreedomCampingLocations
);
locationRouter.get(
  "/epic-photo-spots",
  checkAuth(Role.USER),
  locationController.getEpicPhotoSpots
);
locationRouter.get(
  "/:locationId",
  checkAuth(Role.USER),
  locationController.locationDetailsById
);

// save-location
locationRouter.post(
  "/:locationId/save",
  checkAuth(Role.USER),
  locationController.saveLocationForUser
);
export { locationRouter };
