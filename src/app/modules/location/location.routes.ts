// src/routes/location.routes.ts
import { Router } from "express";
import { locationController } from "./location.controller";

const router = Router();

// Route to get locations by category
router.get("/category", locationController.getLocationsByCategoryController);

export const locationRouter = router;
