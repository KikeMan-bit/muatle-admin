/**
 * The admin's API (muatle-backend's platform_admin app, under /api/v1/admin/),
 * typed as the backend shapes each answer. Every call takes the session's
 * token; the hooks in hooks/use-admin.ts bind it and cache the answers.
 */

import { apiRequest, queryString } from "@/lib/api";

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** An account as the admin shows it: the team's and the businesses' alike. */
export type AdminUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  /** "admin" for Muatle's team, "business" for whoever signs in to a business's panel. */
  role: "admin" | "business";
  is_active: boolean;
  email_verified: boolean;
  has_password: boolean;
  last_login: string | null;
  created_at: string;
};

/** Where an account is a member: the business, and what they are there. */
export type Membership = {
  id: number;
  business: { id: number; name: string; deleted_at: string | null };
  owner: boolean;
  roles: string[];
  is_active: boolean;
  created_at: string;
};

export type AccountRow = AdminUser & { memberships: Membership[] };

export type AccountSession = {
  id: number;
  label: string;
  created_at: string;
  last_used_at: string;
};

export type AccountDetail = AccountRow & { sessions: AccountSession[] };

/** Where a business's subscription stands (business/plans.py). */
export type Subscription = {
  plan: string;
  plan_name: string;
  /** Bolivianos a month; 0 for the trial. */
  price: number;
  /** "trial" or "active" while it lasts, "expired" once its time is over. */
  status: "trial" | "active" | "expired";
  /** When the trial or the paid time ends; null for a plan with no end. */
  ends_at: string | null;
  /** When the panel stops taking changes, a few days after `ends_at`. */
  locks_at: string | null;
  locked: boolean;
  days_left: number | null;
  trial_ends_at: string | null;
  paid_until: string | null;
};

export type BusinessRow = {
  id: number;
  name: string;
  /** ISO code, "BO". */
  country: string | null;
  /** ISO 4217 code, "BOB". */
  currency: string;
  industry: string;
  is_food_business: boolean;
  owner: { name: string; email: string | null } | null;
  /** Open branches and active members, counted. */
  branches: number | null;
  members: number | null;
  subscription: Subscription;
  created_at: string;
  deleted_at: string | null;
};

/** The subscription as the businesses' panel reads it, with this month's usage. */
export type PlanData = {
  id: string;
  name: string;
  status: "trial" | "active" | "expired";
  ends_at: string | null;
  days_left: number | null;
  locks_at: string | null;
  locked: boolean;
  limits: {
    leaves_out: string[];
    menu_orders: number | null;
    extra_menu_orders: boolean;
    table_orders: number | null;
    automatic_inventory: boolean;
  };
  usage: { menu_orders: number; table_orders: number; since: string } | null;
};

export type BranchData = {
  id: number;
  name: string;
  alias: string;
  address: string;
  is_main: boolean;
  is_active: boolean;
  menu_slug: string | null;
  logo: string | null;
  created_at: string;
  ruppit: {
    ruppit_branch_id: number;
    ruppit_branch_name: string;
    publishes_menu: boolean;
    takes_orders: boolean;
    last_synced_at: string | null;
  } | null;
};

export type DeviceData = {
  id: number;
  name: string;
  branch: number;
  linked_by: string;
  created_at: string;
  last_used_at: string | null;
  failed_pins: number;
  locked_until: string | null;
};

export type MemberData = {
  id: number;
  name: string;
  email: string | null;
  user_id: number | null;
  owner: boolean;
  roles: string[];
  branch: number | null;
  has_pin: boolean;
  is_active: boolean;
  invitation_pending: boolean;
  last_login: string | null;
  created_at: string;
};

export type RuppitData = {
  email: string;
  ruppit_business_id: number;
  ruppit_business_name: string;
  needs_reconnect: boolean;
  connected_at: string;
};

export type BusinessDetail = Omit<BusinessRow, "branches" | "members"> & {
  business_age: string | null;
  os_experience: string | null;
  updated_at: string;
  plan: PlanData;
  branches: BranchData[];
  devices: DeviceData[];
  members: MemberData[];
  ruppit: RuppitData | null;
  counts: { products: number; orders: number; orders_last_30_days: number };
};

export type Dashboard = {
  counts: {
    businesses: number;
    trial: number;
    paid: number;
    running: number;
    grace: number;
    locked: number;
    deleted: number;
    new_this_month: number;
    accounts: number;
    orders_this_month: number;
    /** Bolivianos a month from the paid plans still running. */
    monthly_revenue: number;
  };
  by_plan: { plan: string; name: string; count: number }[];
  ending_soon: BusinessRow[];
  locked: BusinessRow[];
  recent: BusinessRow[];
  signups: { day: string; count: number }[];
};

export type PlanOption = { id: string; name: string; price: number };

export type Country = { id: number; name: string; code: string | null; is_active: boolean };
export type Industry = { id: number; name: string; is_active: boolean };

export type BusinessListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  plan?: string;
  state?: string;
  country?: string;
  deleted?: string;
  ordering?: string;
};

export type AccountListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  active?: string;
  ordering?: string;
};

export type PlanChange = {
  plan: string;
  /** "2026-11-11": the day the paid plan ends, as it starts. */
  paid_until?: string | null;
  /** "2026-10-25": the day the trial ends, as it starts. */
  trial_ends_at?: string | null;
};

export type BusinessChanges = Partial<{
  name: string;
  country: string | null;
  currency: string;
  industry: string;
  is_food_business: boolean;
}>;

export type AccountInput = { email: string; password: string; first_name?: string; last_name?: string };

export type AccountChanges = Partial<{
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  is_admin: boolean;
}>;

const ADMIN = "/admin";

export const getMe = (token: string) => apiRequest<AdminUser>(`${ADMIN}/me/`, { token });

export const getDashboard = (token: string) => apiRequest<Dashboard>(`${ADMIN}/dashboard/`, { token });

export const listPlans = (token: string) => apiRequest<PlanOption[]>(`${ADMIN}/plans/`, { token });

export const listBusinesses = (token: string, params: BusinessListParams) =>
  apiRequest<Paginated<BusinessRow>>(`${ADMIN}/businesses/${queryString(params)}`, { token });

export const getBusiness = (token: string, id: string | number) =>
  apiRequest<BusinessDetail>(`${ADMIN}/businesses/${id}/`, { token });

export const updateBusiness = (token: string, id: string | number, changes: BusinessChanges) =>
  apiRequest<BusinessDetail>(`${ADMIN}/businesses/${id}/`, { method: "PATCH", body: changes, token });

export const setBusinessPlan = (token: string, id: string | number, change: PlanChange) =>
  apiRequest<BusinessDetail>(`${ADMIN}/businesses/${id}/plan/`, { method: "POST", body: change, token });

export const restoreBusiness = (token: string, id: string | number) =>
  apiRequest<BusinessDetail>(`${ADMIN}/businesses/${id}/restore/`, { method: "POST", body: {}, token });

export const unlinkDevice = (token: string, id: string | number, deviceId: number) =>
  apiRequest<null>(`${ADMIN}/businesses/${id}/devices/${deviceId}/`, { method: "DELETE", token });

export const listAccounts = (token: string, params: AccountListParams) =>
  apiRequest<Paginated<AccountRow>>(`${ADMIN}/accounts/${queryString(params)}`, { token });

export const getAccount = (token: string, id: string | number) =>
  apiRequest<AccountDetail>(`${ADMIN}/accounts/${id}/`, { token });

export const createAccount = (token: string, input: AccountInput) =>
  apiRequest<AccountDetail>(`${ADMIN}/accounts/`, { method: "POST", body: input, token });

export const updateAccount = (token: string, id: string | number, changes: AccountChanges) =>
  apiRequest<AccountDetail>(`${ADMIN}/accounts/${id}/`, { method: "PATCH", body: changes, token });

export const signOutAccount = (token: string, id: string | number) =>
  apiRequest<AccountDetail>(`${ADMIN}/accounts/${id}/sign-out/`, { method: "POST", body: {}, token });

export const listCountries = (token: string) => apiRequest<Country[]>(`${ADMIN}/countries/`, { token });

export const createCountry = (token: string, input: { name: string; code: string }) =>
  apiRequest<Country>(`${ADMIN}/countries/`, { method: "POST", body: input, token });

export const updateCountry = (token: string, id: number, changes: Partial<Omit<Country, "id">>) =>
  apiRequest<Country>(`${ADMIN}/countries/${id}/`, { method: "PATCH", body: changes, token });

export const listIndustries = (token: string) => apiRequest<Industry[]>(`${ADMIN}/industries/`, { token });

export const createIndustry = (token: string, input: { name: string }) =>
  apiRequest<Industry>(`${ADMIN}/industries/`, { method: "POST", body: input, token });

export const updateIndustry = (token: string, id: number, changes: Partial<Omit<Industry, "id">>) =>
  apiRequest<Industry>(`${ADMIN}/industries/${id}/`, { method: "PATCH", body: changes, token });
