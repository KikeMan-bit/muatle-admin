"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

import * as api from "@/lib/admin-api";
import { ApiError, errorMessage } from "@/lib/api";

/**
 * The session's API token. Empty while the session loads; the queries wait
 * for it. A token the backend no longer takes ends the session here too.
 */
export function useToken(): string {
  return useSession().data?.apiToken ?? "";
}

function signOutIfExpired(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    void signOut({ callbackUrl: "/login" });
  }
}

/** A request whose failure is the caller's to show, except an ended session. */
async function guarded<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    signOutIfExpired(error);
    throw error;
  }
}

// The keys every query and invalidation go by
export const keys = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  plans: ["plans"] as const,
  businesses: (params?: api.BusinessListParams) => ["businesses", params ?? {}] as const,
  business: (id: string | number) => ["business", String(id)] as const,
  accounts: (params?: api.AccountListParams) => ["accounts", params ?? {}] as const,
  account: (id: string | number) => ["account", String(id)] as const,
  countries: ["countries"] as const,
  industries: ["industries"] as const,
  coupons: ["coupons"] as const,
  partnerProgram: ["partner-program"] as const,
  partners: (params?: api.PartnerListParams) => ["partners", params ?? {}] as const,
  partner: (id: string | number) => ["partner", String(id)] as const,
  partnerOptions: ["partner-options"] as const,
};

export function useMe() {
  const token = useToken();
  return useQuery({ queryKey: keys.me, queryFn: () => guarded(api.getMe(token)), enabled: !!token });
}

export function useDashboard() {
  const token = useToken();
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => guarded(api.getDashboard(token)),
    enabled: !!token,
    // What it counts moves slowly; a look a minute is plenty
    staleTime: 60_000,
  });
}

export function usePlans() {
  const token = useToken();
  return useQuery({
    queryKey: keys.plans,
    queryFn: () => guarded(api.listPlans(token)),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useBusinesses(params: api.BusinessListParams) {
  const token = useToken();
  return useQuery({
    queryKey: keys.businesses(params),
    queryFn: () => guarded(api.listBusinesses(token, params)),
    enabled: !!token,
    // The page that was on screen stays while the next one loads
    placeholderData: (previous) => previous,
  });
}

export function useBusiness(id: string | number) {
  const token = useToken();
  return useQuery({
    queryKey: keys.business(id),
    queryFn: () => guarded(api.getBusiness(token, id)),
    enabled: !!token,
  });
}

export function useAccounts(params: api.AccountListParams) {
  const token = useToken();
  return useQuery({
    queryKey: keys.accounts(params),
    queryFn: () => guarded(api.listAccounts(token, params)),
    enabled: !!token,
    placeholderData: (previous) => previous,
  });
}

export function useAccount(id: string | number) {
  const token = useToken();
  return useQuery({
    queryKey: keys.account(id),
    queryFn: () => guarded(api.getAccount(token, id)),
    enabled: !!token,
  });
}

export function useCountries() {
  const token = useToken();
  return useQuery({
    queryKey: keys.countries,
    queryFn: () => guarded(api.listCountries(token)),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useCoupons() {
  const token = useToken();
  return useQuery({ queryKey: keys.coupons, queryFn: () => guarded(api.listCoupons(token)), enabled: !!token });
}

export function useIndustries() {
  const token = useToken();
  return useQuery({
    queryKey: keys.industries,
    queryFn: () => guarded(api.listIndustries(token)),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function usePartnerProgram() {
  const token = useToken();
  return useQuery({ queryKey: keys.partnerProgram, queryFn: () => guarded(api.getPartnerProgram(token)), enabled: !!token });
}

export function usePartners(params: api.PartnerListParams) {
  const token = useToken();
  return useQuery({
    queryKey: keys.partners(params),
    queryFn: () => guarded(api.listPartners(token, params)),
    enabled: !!token,
    placeholderData: (previous) => previous,
  });
}

export function usePartner(id: string | number) {
  const token = useToken();
  return useQuery({
    queryKey: keys.partner(id),
    queryFn: () => guarded(api.getPartner(token, id)),
    enabled: !!token,
  });
}

/** Every ally, for picking the one who brought a business; only read once that dialog opens. */
export function usePartnerOptions({ enabled = true }: { enabled?: boolean } = {}) {
  const token = useToken();
  return useQuery({
    queryKey: keys.partnerOptions,
    queryFn: () => guarded(api.listPartnerOptions(token)),
    enabled: !!token && enabled,
  });
}

type Mutation<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">;

/**
 * A change sent to the backend: on success the lists and pages it touches are
 * read again and a toast says so; on failure the backend's own words show.
 * The caller's `onSuccess` and `onError` run too, for closing a dialog or
 * keeping a field's message.
 */
function useChange<TData, TVariables>(
  run: (token: string, variables: TVariables) => Promise<TData>,
  {
    invalidate,
    success,
  }: {
    invalidate: (variables: TVariables, data: TData) => readonly (readonly unknown[])[];
    success?: string | ((data: TData, variables: TVariables) => string);
  },
  options: Mutation<TData, TVariables> = {},
) {
  const token = useToken();
  const client = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    ...options,
    mutationFn: (variables) => guarded(run(token, variables)),
    onSuccess: (data, variables, onMutateResult, context) => {
      for (const key of invalidate(variables, data)) void client.invalidateQueries({ queryKey: key });
      if (success) toast.success(typeof success === "function" ? success(data, variables) : success);
      options.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(errorMessage(error));
      options.onError?.(error, variables, onMutateResult, context);
    },
  });
}

const businessKeys = (id: string | number): readonly (readonly unknown[])[] => [keys.business(id), ["businesses"], keys.dashboard];

export function useUpdateBusiness(id: string | number, options?: Mutation<api.BusinessDetail, api.BusinessChanges>) {
  return useChange((token, changes) => api.updateBusiness(token, id, changes), { invalidate: () => businessKeys(id), success: "Negocio actualizado." }, options);
}

export function useSetBusinessPlan(id: string | number, options?: Mutation<api.BusinessDetail, api.PlanChange>) {
  return useChange(
    (token, change) => api.setBusinessPlan(token, id, change),
    { invalidate: () => businessKeys(id), success: (data) => `${data.subscription.plan_name} activado para ${data.name}.` },
    options,
  );
}

export function useRestoreBusiness(id: string | number, options?: Mutation<api.BusinessDetail, void>) {
  return useChange(
    (token) => api.restoreBusiness(token, id),
    { invalidate: () => businessKeys(id), success: "Negocio restaurado: su dueño puede volver a entrar." },
    options,
  );
}

export function useUnlinkDevice(id: string | number, options?: Mutation<null, number>) {
  return useChange(
    (token, deviceId) => api.unlinkDevice(token, id, deviceId),
    { invalidate: () => [keys.business(id)], success: "Dispositivo desvinculado. Quedó anotado en el historial de seguridad del negocio." },
    options,
  );
}

const accountKeys = (id: string | number): readonly (readonly unknown[])[] => [keys.account(id), ["accounts"], keys.dashboard];

export function useCreateAccount(options?: Mutation<api.AccountDetail, api.AccountInput>) {
  return useChange(
    (token, input) => api.createAccount(token, input),
    { invalidate: () => [["accounts"], keys.dashboard], success: (data) => `Cuenta creada: ${data.email} ya puede entrar al admin.` },
    options,
  );
}

export function useUpdateAccount(id: string | number, options?: Mutation<api.AccountDetail, api.AccountChanges>) {
  return useChange((token, changes) => api.updateAccount(token, id, changes), { invalidate: () => accountKeys(id), success: "Cuenta actualizada." }, options);
}

export function useSignOutAccount(id: string | number, options?: Mutation<api.AccountDetail, void>) {
  return useChange(
    (token) => api.signOutAccount(token, id),
    { invalidate: () => [keys.account(id)], success: "La cuenta quedó cerrada en todos sus dispositivos." },
    options,
  );
}

export function useCreateCountry(options?: Mutation<api.Country, { name: string; code: string }>) {
  return useChange((token, input) => api.createCountry(token, input), { invalidate: () => [keys.countries], success: "País agregado." }, options);
}

export function useUpdateCountry(options?: Mutation<api.Country, { id: number } & Partial<Omit<api.Country, "id">>>) {
  return useChange(
    (token, { id, ...changes }) => api.updateCountry(token, id, changes),
    { invalidate: () => [keys.countries], success: "País actualizado." },
    options,
  );
}

export function useCreateIndustry(options?: Mutation<api.Industry, { name: string }>) {
  return useChange((token, input) => api.createIndustry(token, input), { invalidate: () => [keys.industries], success: "Rubro agregado." }, options);
}

export function useUpdateIndustry(options?: Mutation<api.Industry, { id: number } & Partial<Omit<api.Industry, "id">>>) {
  return useChange(
    (token, { id, ...changes }) => api.updateIndustry(token, id, changes),
    { invalidate: () => [keys.industries], success: "Rubro actualizado." },
    options,
  );
}

export function useCreateCoupon(options?: Mutation<api.Coupon, api.CouponInput>) {
  return useChange(
    (token, input) => api.createCoupon(token, input),
    { invalidate: () => [keys.coupons], success: (coupon) => `Cupón ${coupon.code} creado.` },
    options,
  );
}

export function useUpdateCoupon(options?: Mutation<api.Coupon, { id: number } & api.CouponInput>) {
  return useChange(
    (token, { id, ...changes }) => api.updateCoupon(token, id, changes),
    { invalidate: () => [keys.coupons], success: "Cupón actualizado." },
    options,
  );
}

export function useSetBusinessPartner(id: string | number, options?: Mutation<api.BusinessDetail, number | null>) {
  return useChange(
    (token, partner) => api.setBusinessPartner(token, id, partner),
    {
      // The allies' pages count their businesses: the one it had and the one it has now
      invalidate: () => [...businessKeys(id), ["partners"], ["partner"]],
      success: (data) => (data.partner ? `${data.name} quedó como negocio de ${data.partner.name}.` : `${data.name} quedó sin aliado.`),
    },
    options,
  );
}

export function useUpdatePartnerProgram(options?: Mutation<api.PartnerProgram, Partial<api.Deal>>) {
  return useChange(
    (token, changes) => api.updatePartnerProgram(token, changes),
    {
      // Every ally on the general deal shows it
      invalidate: () => [keys.partnerProgram, ["partners"], ["partner"]],
      success: "Comisión general actualizada. Vale desde el próximo pago de cada negocio.",
    },
    options,
  );
}

/** What a change to an ally reads again: their page, the list, the picker of the businesses' page and Inicio. */
const partnerKeys = (id: string | number): readonly (readonly unknown[])[] => [keys.partner(id), ["partners"], keys.partnerOptions, keys.dashboard];

/** Its toast is the dialog's: green when the invitation went out, a warning when it did not. */
export function useCreatePartner(options?: Mutation<api.PartnerInvited, api.PartnerInput>) {
  return useChange(
    (token, input) => api.createPartner(token, input),
    { invalidate: () => [["partners"], keys.partnerOptions, keys.dashboard, ["accounts"]] },
    options,
  );
}

export function useUpdatePartner(id: string | number, options?: Mutation<api.PartnerDetail, api.PartnerChanges>) {
  return useChange(
    (token, changes) => api.updatePartner(token, id, changes),
    // A business's page names its ally
    { invalidate: () => [...partnerKeys(id), ["businesses"], ["business"], ["accounts"]], success: "Aliado actualizado." },
    options,
  );
}

/** Its toast is the caller's, as when making an ally. */
export function useInvitePartner(id: string | number, options?: Mutation<api.PartnerInvited, void>) {
  return useChange((token) => api.invitePartner(token, id), { invalidate: () => [keys.partner(id), ["partners"]] }, options);
}

export function usePayPartner(id: string | number, options?: Mutation<api.PartnerDetail, api.PayoutInput>) {
  return useChange(
    (token, input) => api.payPartner(token, id, input),
    { invalidate: () => partnerKeys(id), success: "Pago registrado. El aliado ya lo ve en su panel." },
    options,
  );
}

export function useAddCommission(id: string | number, options?: Mutation<api.PartnerDetail, api.CommissionInput>) {
  return useChange(
    (token, input) => api.addCommission(token, id, input),
    { invalidate: () => partnerKeys(id), success: "Comisión agregada: queda por cobrar con las demás." },
    options,
  );
}

export function useVoidCommission(id: string | number, options?: Mutation<api.PartnerDetail, { commission: number; reason: string }>) {
  return useChange(
    (token, { commission, reason }) => api.voidCommission(token, commission, reason),
    { invalidate: () => partnerKeys(id), success: "Comisión anulada." },
    options,
  );
}

export function useUndoPayout(id: string | number, options?: Mutation<api.PartnerDetail, number>) {
  return useChange(
    (token, payout) => api.undoPayout(token, payout),
    { invalidate: () => partnerKeys(id), success: "Pago deshecho: sus comisiones vuelven a estar por cobrar." },
    options,
  );
}

/** The first message the backend gave for a field, to show under it. */
export function fieldError(error: unknown, field: string): string | undefined {
  return error instanceof ApiError ? error.fields[field] : undefined;
}

/** Whether the mutation's error names any of these fields, so the general message is not shown twice. */
export function useFieldErrors(error: unknown, fields: string[]) {
  return React.useMemo(() => {
    const found: Partial<Record<string, string>> = {};
    for (const field of fields) {
      const message = fieldError(error, field);
      if (message) found[field] = message;
    }
    return found;
  }, [error, fields]);
}
