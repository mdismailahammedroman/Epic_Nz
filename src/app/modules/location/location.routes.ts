import { locationController } from "./location.controller";
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../helper/validateRequest";
import { LocationValidation } from "./location.validation";

const router = Router();

router.post(
  "/submit",
  checkAuth(Role.USER),
  multerUpload.single("image"), // <-- ADD THIS LINE
  validateRequest(LocationValidation.createLocationValidationSchema),
  locationController.submitLocation
);
router.get("/all", checkAuth(Role.USER), locationController.getAllActivities);
router.get("/hikes", checkAuth(Role.USER), locationController.getHikes);
router.get(
  "/campgrounds",
  checkAuth(Role.USER),
  locationController.getCampgrounds
);
router.get(
  "/freedom-camping-locations",
  checkAuth(Role.USER),
  locationController.getFreedomCampingLocations
);
router.get(
  "/epic-photo-spots",
  checkAuth(Role.USER),
  locationController.getEpicPhotoSpots
);
router.get(
  "/:locationId",
  checkAuth(Role.USER),
  locationController.locationDetailsById
);

// save-location
router.post(
  "/:locationId/save",
  checkAuth(Role.USER),
  locationController.saveLocationForUser
);

// POST /locations/{id}/share – Share a location with others via deep link.
router.post(
  "/:locationId/share",
  checkAuth(Role.USER),
  locationController.shareLocation
);

// POST /locations/{id}/rating – location adventure rating .
router.post(
  "/:locationId/rating",
  checkAuth(Role.USER),
  locationController.locationRating
);
export const locationRouter = router;
