/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assessments from "../assessments.js";
import type * as auth from "../auth.js";
import type * as candidates from "../candidates.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as sessions from "../sessions.js";
import type * as testData from "../testData.js";
import type * as vapiApi from "../vapiApi.js";
import type * as vapiIntegration from "../vapiIntegration.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assessments: typeof assessments;
  auth: typeof auth;
  candidates: typeof candidates;
  http: typeof http;
  internal: typeof internal_;
  sessions: typeof sessions;
  testData: typeof testData;
  vapiApi: typeof vapiApi;
  vapiIntegration: typeof vapiIntegration;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
