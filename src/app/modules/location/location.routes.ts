import { locationController } from "./location.controller";
import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import { multerUpload } from "../../config/multer.config";
import { validateRequest } from "../../helper/validateRequest";
import { LocationValidation } from "./location.validation";

const router = Router();

// submit location
router.post(
"/submit",
checkAuth(...Object.values(Role)),
multerUpload.array("image", 5),
validateRequest(LocationValidation.createLocationValidationSchema),
locationController.submitLocation
);

// get all activities
router.get(
"/all",
checkAuth(...Object.values(Role)),
locationController.getAllActivities
);

// my submissions
router.get(
"/my-submissions",
checkAuth(Role.USER),
locationController.getUserSubmissions
);

// category routes
router.get(
"/hikes",
checkAuth(...Object.values(Role)),
locationController.getHikes
);

router.get(
"/campgrounds",
checkAuth(...Object.values(Role)),
locationController.getCampgrounds
);

router.get(
"/freedom-camping-locations",
checkAuth(...Object.values(Role)),
locationController.getFreedomCampingLocations
);

router.get(
"/epic-photo-spots",
checkAuth(...Object.values(Role)),
locationController.getEpicPhotoSpots
);

// location pins (map)
router.get("/pins", locationController.getLocationPins);

// save / unsave
router.post(
"/:locationId/save",
checkAuth(Role.USER),
locationController.saveLocationForUser
);

router.post(
"/:locationId/unsave",
checkAuth(Role.USER),
locationController.unsaveLocationForUser
);

// share location
router.post(
"/:locationId/share",
checkAuth(Role.USER),
locationController.shareLocation
);

// rating
router.post(
"/:locationId/rating",
checkAuth(Role.USER),
locationController.locationRating
);

// approve / reject (admin)
router.patch(
"/approve/:locationId",
checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
locationController.approveLocation
);

router.patch(
"/reject/:locationId",
checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
locationController.rejectLocation
);

// delete location
router.delete(
"/delete/:locationId",
checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
locationController.deleteLocation
);

// update location
router.patch(
"/update/:locationId",
checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
validateRequest(LocationValidation.updateLocationValidationSchema),
locationController.updateLocation
);

// admin status wise list
router.get(
"/",
checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
locationController.getLocationsByStatusWise
);

// ⚠️ dynamic route always LAST
router.get(
"/:locationId",
checkAuth(...Object.values(Role)),
locationController.locationDetailsById
);

export const locationRouter = router;
