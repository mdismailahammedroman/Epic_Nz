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
  checkAuth(...Object.values(Role)),
  multerUpload.array("image", 5),
  validateRequest(LocationValidation.createLocationValidationSchema),
  locationController.submitLocation,
);
router.get(
  "/all",
  checkAuth(...Object.values(Role)),
  locationController.getAllActivities,
);

router.get(
  "/my-submissions",
  checkAuth(Role.USER), // Ensure the user is authenticated
  locationController.getUserSubmissions, // Call the controller method
);

router.get(
  "/hikes",
  checkAuth(...Object.values(Role)),
  locationController.getHikes,
);
router.get(
  "/campgrounds",
  checkAuth(...Object.values(Role)),
  locationController.getCampgrounds,
);
router.get(
  "/freedom-camping-locations",
  checkAuth(...Object.values(Role)),
  locationController.getFreedomCampingLocations,
);
router.get(
  "/epic-photo-spots",
  checkAuth(...Object.values(Role)),
  locationController.getEpicPhotoSpots,
);
router.get(
  "/:locationId",
  checkAuth(...Object.values(Role)),
  locationController.locationDetailsById,
);

// save-location
router.post(
  "/:locationId/save",
  checkAuth(Role.USER),
  locationController.saveLocationForUser,
);
router.post(
  "/:locationId/unsave",
  checkAuth(Role.USER),
  locationController.unsaveLocationForUser,
);

// POST /locations/{id}/share – Share a location with others via deep link.
router.post(
  "/:locationId/share",
  checkAuth(Role.USER),
  locationController.shareLocation,
);

// POST /locations/{id}/rating – location adventure rating .
router.post(
  "/:locationId/rating",
  checkAuth(Role.USER),
  locationController.locationRating,
);

// Approve location (ADMIN only)
router.patch(
  "/approve/:locationId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  locationController.approveLocation,
);

router.patch(
  "/reject/:locationId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  locationController.rejectLocation,
);

router.get("/pins", locationController.getLocationPins);
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  locationController.getLocationsByStatusWise,
);

router.delete(
  "/delete/:locationId",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  locationController.deleteLocation,
);

export const locationRouter = router;
