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
  /**
   * "admin" for Muatle's team, "partner" for an ally (their account is never a
   * business's), "business" for whoever signs in to a business's panel.
   */
  role: "admin" | "partner" | "business";
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
  /** The ally who brought it; null for one no ally brought. */
  partner: BusinessPartner | null;
  /** Open branches and active members, counted. */
  branches: number | null;
  members: number | null;
  subscription: Subscription;
  created_at: string;
  deleted_at: string | null;
};

/** How a business came to be an ally's: signing up with their code, or set here. */
export type ReferralSource = "signup" | "admin";

/** The ally who brought a business, as its row names them. */
export type BusinessPartner = {
  id: number;
  code: string;
  name: string;
  source: ReferralSource;
  referred_at: string;
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
  /** The allies still on, and what they all have to collect ("264.00"). */
  partners: { active: number; pending: string };
  by_plan: { plan: string; name: string; count: number }[];
  ending_soon: BusinessRow[];
  locked: BusinessRow[];
  recent: BusinessRow[];
  signups: { day: string; count: number }[];
};

export type PlanOption = { id: string; name: string; price: number };

export type Country = { id: number; name: string; code: string | null; is_active: boolean };
export type Industry = { id: number; name: string; is_active: boolean };

/** A percentage off, or bolivianos off the total. */
export type CouponKind = "percent" | "amount";

/** A discount coupon for the panel's checkout (business/coupons.py), with the payments paid with it. */
export type Coupon = {
  id: number;
  code: string;
  kind: CouponKind;
  /** "30.00": the percentage, or the bolivianos. */
  value: string;
  /** The plans it is good for; empty, all of them. */
  plans: string[];
  /** The ways of paying it is good for; empty, both. */
  billings: ("monthly" | "yearly")[];
  /** Its last day ("2026-10-31"); null, it does not expire. */
  expires_on: string | null;
  /** Payments it can take off, all businesses together; null, no limit. */
  max_uses: number | null;
  once_per_business: boolean;
  is_active: boolean;
  note: string;
  /** Payments paid with it; a QR made and never paid is none. */
  uses: number;
  created_at: string;
};

/** What the team writes of a coupon; the code only when making it, and blank for one made up. */
export type CouponInput = Partial<Omit<Coupon, "id" | "uses" | "created_at">>;

/**
 * A deal: the share of each payment ("20.00", from 0 to 100) and how many
 * paid months of each business earn it; null, all of them, always.
 */
export type Deal = { percent: string; months: number | null };

/** The general deal every ally without one of their own earns by (partners.Program). */
export type PartnerProgram = Deal & { updated_at: string; updated_by: string | null };

/** Where an ally gets paid, as they write it in their panel; every field may be empty. */
export type PayoutDetails = { bank: string; account: string; holder: string; document: string; note: string };

/** An ally (partners.Partner): someone outside Muatle who brings businesses and earns a share of what they pay. */
export type Partner = {
  id: number;
  /** In capitals, as in their link and as businesses type it: "JUAN". */
  code: string;
  /** The link they share: /r/<code> in the panel, which keeps the code for the sign-up. */
  link: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  /** What they earn by now: their own deal, or the general one. */
  commission: Deal & { own: boolean };
  is_active: boolean;
  payout_details: PayoutDetails;
  /** The QR of their account, for paying them by scanning it. */
  payout_qr: string | null;
  /** When they last changed where they get paid. */
  payout_updated_at: string | null;
  created_at: string;
};

/** An ally in the list, with what they brought and earned. */
export type PartnerRow = Partner & {
  /** For the team: "Amigo de la feria". */
  note: string;
  /** Still without a password: their invitation was not used. */
  invitation_pending: boolean;
  last_login: string | null;
  /** The businesses they brought, and how many have a paid plan running now. */
  businesses: number;
  paying: number;
  /** To collect and already paid, in bolivianos: "88.00". */
  pending: string;
  paid: string;
};

/** "trial" while it tries Muatle, "active" with a paid plan running, "expired" once it ended, "deleted" once its owner deleted it. */
export type ReferralState = "trial" | "active" | "expired" | "deleted";

/** A business an ally brought, with where it stands and what it earned them. */
export type Referral = {
  id: number;
  business: string;
  business_id: number;
  country: string | null;
  referred_at: string;
  source: ReferralSource;
  state: ReferralState;
  plan: string;
  plan_name: string;
  ends_at: string | null;
  /** Its paid months that earned the ally a commission, out of `months` (null: always). */
  months_counted: number;
  months: number | null;
  earned: string;
};

export type CommissionStatus = "pending" | "paid" | "void";

/** What an ally earned: a share of one payment ("payment"), or a sum the team wrote by hand ("manual"). */
export type Commission = {
  id: number;
  created_at: string;
  /** The business's name as it was; it outlives the business. */
  business: string;
  business_id: number | null;
  kind: "payment" | "manual";
  plan: string | null;
  plan_name: string | null;
  /** The business's paid months it counted; 0 for a sum by hand. */
  months: number;
  /** What it was worked out on: the part of the payment its months make. */
  base: string;
  percent: string | null;
  amount: string;
  status: CommissionStatus;
  /** Why it was written by hand. */
  note: string;
  void_reason: string;
  voided_at: string | null;
  payout: number | null;
  paid_on: string | null;
  /** Who wrote it by hand; null for one a payment earned. */
  created_by: string | null;
};

/** What Muatle paid an ally: the commissions they had to collect then, all at once. */
export type Payout = {
  id: number;
  /** "2026-10-26". */
  paid_on: string;
  amount: string;
  /** How it went: "Transferencia BNB". */
  note: string;
  /** How many commissions it took. */
  commissions: number;
  created_at: string;
  created_by: string | null;
};

export type PartnerDetail = PartnerRow & {
  referrals: Referral[];
  commissions: Commission[];
  payouts: Payout[];
};

/** An ally to pick as the one who brought a business. */
export type PartnerOption = { id: number; code: string; name: string; is_active: boolean };

/** What the team writes of a new ally: their code blank for one made from their name, their deal the general one unless `own_commission`. */
export type PartnerInput = {
  email: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  code?: string;
  own_commission?: boolean;
  percent?: string;
  months?: number | null;
  note?: string;
};

export type PartnerChanges = Partial<Omit<PartnerInput, "email"> & { is_active: boolean }>;

/** A payout: the day it was made, how, and which commissions (none: all they have to collect). */
export type PayoutInput = { paid_on?: string; note?: string; commissions?: number[] };

/** A sum for an ally written by hand, with why, and the business it is about if any. */
export type CommissionInput = { amount: string; note: string; business?: number | null };

/** Answers to making an ally, or sending their invitation again: whether the email went out. */
export type PartnerInvited = PartnerDetail & { invitation_sent: boolean };

export type BusinessListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  plan?: string;
  state?: string;
  country?: string;
  deleted?: string;
  /** The ones the ally with this id brought. */
  partner?: number;
  ordering?: string;
};

export type PartnerListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  /** "yes" or "no". */
  active?: string;
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

export const listCoupons = (token: string) => apiRequest<Coupon[]>(`${ADMIN}/coupons/`, { token });

export const createCoupon = (token: string, input: CouponInput) =>
  apiRequest<Coupon>(`${ADMIN}/coupons/`, { method: "POST", body: input, token });

export const updateCoupon = (token: string, id: number, changes: CouponInput) =>
  apiRequest<Coupon>(`${ADMIN}/coupons/${id}/`, { method: "PATCH", body: changes, token });

export const setBusinessPartner = (token: string, id: string | number, partner: number | null) =>
  apiRequest<BusinessDetail>(`${ADMIN}/businesses/${id}/partner/`, { method: "POST", body: { partner }, token });

export const getPartnerProgram = (token: string) => apiRequest<PartnerProgram>(`${ADMIN}/partner-program/`, { token });

export const updatePartnerProgram = (token: string, changes: Partial<Deal>) =>
  apiRequest<PartnerProgram>(`${ADMIN}/partner-program/`, { method: "PATCH", body: changes, token });

export const listPartners = (token: string, params: PartnerListParams) =>
  apiRequest<Paginated<PartnerRow>>(`${ADMIN}/partners/${queryString(params)}`, { token });

export const listPartnerOptions = (token: string) => apiRequest<PartnerOption[]>(`${ADMIN}/partners/options/`, { token });

export const getPartner = (token: string, id: string | number) =>
  apiRequest<PartnerDetail>(`${ADMIN}/partners/${id}/`, { token });

export const createPartner = (token: string, input: PartnerInput) =>
  apiRequest<PartnerInvited>(`${ADMIN}/partners/`, { method: "POST", body: input, token });

export const updatePartner = (token: string, id: string | number, changes: PartnerChanges) =>
  apiRequest<PartnerDetail>(`${ADMIN}/partners/${id}/`, { method: "PATCH", body: changes, token });

export const invitePartner = (token: string, id: string | number) =>
  apiRequest<PartnerInvited>(`${ADMIN}/partners/${id}/invite/`, { method: "POST", body: {}, token });

export const payPartner = (token: string, id: string | number, input: PayoutInput) =>
  apiRequest<PartnerDetail>(`${ADMIN}/partners/${id}/payouts/`, { method: "POST", body: input, token });

export const addCommission = (token: string, id: string | number, input: CommissionInput) =>
  apiRequest<PartnerDetail>(`${ADMIN}/partners/${id}/commissions/`, { method: "POST", body: input, token });

export const voidCommission = (token: string, commissionId: number, reason: string) =>
  apiRequest<PartnerDetail>(`${ADMIN}/partner-commissions/${commissionId}/void/`, { method: "POST", body: { reason }, token });

export const undoPayout = (token: string, payoutId: number) =>
  apiRequest<PartnerDetail>(`${ADMIN}/partner-payouts/${payoutId}/`, { method: "DELETE", token });
