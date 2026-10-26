// Content of each Backend guide, by slug (titles and descriptions are in lib/backend-pages.ts).
import type { ComponentType } from "react";
import ActivityLog from "./activity-log";
import AiChat from "./ai-chat";
import ApiKeys from "./api-keys";
import Authentication from "./authentication";
import BackgroundTasks from "./background-tasks";
import Billing from "./billing";
import ClientAndHooks from "./client-and-hooks";
import Conventions from "./conventions";
import Deployment from "./deployment";
import Emails from "./emails";
import Files from "./files";
import Installation from "./installation";
import Internationalization from "./internationalization";
import ListsAndTables from "./lists-and-tables";
import Marketing from "./marketing";
import Notifications from "./notifications";
import OAuth from "./oauth";
import Overview from "./overview";
import RateLimitingAndCache from "./rate-limiting-and-cache";
import RolesAndPermissions from "./roles-and-permissions";
import Staff from "./staff";
import Testing from "./testing";
import TwoFactor from "./two-factor";
import Webhooks from "./webhooks";

export const BACKEND_CONTENT: Record<string, ComponentType> = {
  overview: Overview,
  installation: Installation,
  conventions: Conventions,
  authentication: Authentication,
  "two-factor": TwoFactor,
  oauth: OAuth,
  "roles-and-permissions": RolesAndPermissions,
  "api-keys": ApiKeys,
  "lists-and-tables": ListsAndTables,
  files: Files,
  notifications: Notifications,
  emails: Emails,
  "activity-log": ActivityLog,
  "rate-limiting-and-cache": RateLimitingAndCache,
  "background-tasks": BackgroundTasks,
  webhooks: Webhooks,
  "ai-chat": AiChat,
  marketing: Marketing,
  billing: Billing,
  staff: Staff,
  internationalization: Internationalization,
  "client-and-hooks": ClientAndHooks,
  testing: Testing,
  deployment: Deployment,
};
