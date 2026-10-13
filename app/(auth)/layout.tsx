/**
 * The sign-in screen: the card dead center over the brand's grey gradient,
 * the same as the businesses' panel, so the team knows where they are.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate grid min-h-svh grid-rows-[1fr_auto_1fr] bg-linear-to-b from-auth-from to-auth-to px-4">
      <main className="row-start-2 mx-auto w-full max-w-md py-6">{children}</main>
      <footer className="row-start-3 flex items-end justify-center pb-4 text-sm text-muted-foreground">
        Solo para el equipo de Muatle
      </footer>
    </div>
  );
}
