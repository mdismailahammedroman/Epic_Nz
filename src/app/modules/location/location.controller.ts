// src/controllers/location.controller.ts
import { Request, Response } from "express";
import { sendResponse } from "../../utils/SendResponse";
import { CatchAsync } from "../../utils/catchAsync";
import { locationServices } from "./location.service";

// Create Location
const getLocationsByCategoryController = CatchAsync(
  async (req: Request, res: Response, next) => {
    const { category } = req.query; // Extract the category from the query parameters
    const page = parseInt((req.query.page as string) || "1", 10); // Pagination page (default 1)
    const limit = parseInt((req.query.limit as string) || "10", 10); // Pagination limit (default 10)

    if (!category) {
      res.status(400).json({
        success: false,
        message: "Category is required",
      });
      return;
    }

    // Call service to get nearby locations
    const locations = await locationServices.getLocationsByCategoryController(
      category as string,
      page,
      limit
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Locations fetched successfully for category: ${category}`,
      data: locations,
    });
  }
);

export const locationController = {
  getLocationsByCategoryController,
};
