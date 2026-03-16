/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as admin from "../admin.js";
import type * as bookings from "../bookings.js";
import type * as bugs from "../bugs.js";
import type * as comments from "../comments.js";
import type * as emails from "../emails.js";
import type * as globalSettings from "../globalSettings.js";
import type * as mapLocations from "../mapLocations.js";
import type * as modules from "../modules.js";
import type * as pages from "../pages.js";
import type * as permissions from "../permissions.js";
import type * as projects from "../projects.js";
import type * as statuses from "../statuses.js";
import type * as temp from "../temp.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  admin: typeof admin;
  bookings: typeof bookings;
  bugs: typeof bugs;
  comments: typeof comments;
  emails: typeof emails;
  globalSettings: typeof globalSettings;
  mapLocations: typeof mapLocations;
  modules: typeof modules;
  pages: typeof pages;
  permissions: typeof permissions;
  projects: typeof projects;
  statuses: typeof statuses;
  temp: typeof temp;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
