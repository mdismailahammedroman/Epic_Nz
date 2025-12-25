import { Query, Types } from "mongoose";
import { ICoord } from "../modules/user/user.interface";

export class QueryBuilder<T> {
  public queryModel: Query<T[], T>;
  public query: Record<string, string>;

  constructor(queryModel: Query<T[], T>, query: Record<string, string>) {
    this.queryModel = queryModel;
    this.query = query;
  }

  // CASE SENSITIVE FILTERING
  filter(): this {
    const filter = { ...this.query };

    // Remove excluded fields (can be useful for sensitive fields like password, etc.)
    const excludeFields = ["password", "isDeleted"]; // Example of excluded fields, you can customize this
    excludeFields.forEach((field) => delete filter[field]);

    this.queryModel = this.queryModel.find(filter);
    return this;
  }

  // FILTER BY DATE RANGE (e.g., upcoming events within a certain number of days)
  dateFilter(): this {
    const days = Number(this.query.dateRange);
    if (!days || isNaN(days)) return this;

    const now = new Date();
    this.queryModel = this.queryModel.find({
      event_start: {
        $gte: now,
        $lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    return this;
  }

  // TEXT BASED SEARCH ON fields like title, description, venue
  textSearch(): this {
    const searchTerm = this.query.searchTerm;
    if (!searchTerm) return this;

    this.queryModel = this.queryModel
      .find(
        { $text: { $search: searchTerm } },
        { score: { $meta: "textScore" } } // relevance score for text search
      )
      .sort({ score: { $meta: "textScore" } });

    return this;
  }

  // FIELD FILTERING (selecting specific fields to return)
  select(): this {
    const fields = this.query.fields?.split(",").join(" ") || ""; // Example: "title,description,price"
    this.queryModel = this.queryModel.select(fields);
    return this;
  }

  // FILTER BY CATEGORY
  category(): this {
    const categoryId = this.query.category;
    if (!categoryId) return this;

    this.queryModel = this.queryModel.find({ category: categoryId });
    return this;
  }

  // NEARBY QUERY (Geospatial query for location-based searches)
  nearby(userCurrentPosition: ICoord): this {
    if (
      !userCurrentPosition ||
      userCurrentPosition.lat == null ||
      userCurrentPosition.long == null
    ) {
      return this;
    }

    const maxDistance = Number(this.query.nearby); // Maximum distance in meters
    if (!maxDistance || maxDistance <= 0) return this;

    // Geospatial query using $nearSphere to find nearby events
    const nearbyCondition = {
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [userCurrentPosition.long, userCurrentPosition.lat],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    this.queryModel = this.queryModel.find(nearbyCondition);
    return this;
  }

  // GET EVENTS BY USER INTERESTS (e.g., based on categories the user is interested in)
  interests(interests: Types.ObjectId[]): this {
    if (interests && interests.length > 0) {
      this.queryModel = this.queryModel.find({ category: { $in: interests } });
    }
    return this;
  }

  // SORTING (e.g., by createdAt or other fields)
  sort(): this {
    const sort = this.query.sort || "-createdAt"; // Default sorting by createdAt (descending)
    this.queryModel = this.queryModel.sort(sort);
    return this;
  }

  // PAGINATION (Handle pagination by limiting and skipping records)
  paginate(): this {
    const page = Number(this.query.page) || 1; // Default to page 1
    const limit = Number(this.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

    this.queryModel = this.queryModel.skip(skip).limit(limit);
    return this;
  }

  // JOINING COLLECTIONS DYNAMICALLY (using populate to join referenced collections)
  join(): this {
    const joinQuery = this.query?.join;

    if (!joinQuery) {
      return this;
    }

    const refs = joinQuery.split(",");

    refs.forEach((ref) => {
      this.queryModel = this.queryModel.populate({ path: ref });
    });

    return this;
  }

  // FINALIZE AND BUILD THE QUERY INSTANCE
  build() {
    return this.queryModel;
  }

  // GET META DATA (for pagination)
  async getMeta() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalDocuments = await this.queryModel.model.countDocuments();
    const totalPage = Math.ceil(totalDocuments / limit);

    return {
      page,
      limit,
      total: totalDocuments,
      totalPage,
    };
  }
}
