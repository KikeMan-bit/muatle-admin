"use client";

import * as React from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/ui/country-flag";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fieldError,
  useCountries,
  useCreateCountry,
  useCreateIndustry,
  useIndustries,
  useUpdateCountry,
  useUpdateIndustry,
} from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import type { Country, Industry } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";

/** "Parámetros": the countries and lines the sign-up offers; switched off rather than deleted. */
function Parameters() {
  const [view, setView] = useUrlState({ tab: "countries" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Parámetros"
        description="Las listas que el registro de un negocio ofrece. Un país o rubro apagado deja de ofrecerse, pero los negocios que ya lo tienen lo conservan."
      />
      <Tabs value={view.tab} onValueChange={(tab) => setView({ tab })}>
        <TabsList variant="chips" aria-label="Lista">
          <TabsTrigger value="countries">Países</TabsTrigger>
          <TabsTrigger value="industries">Rubros</TabsTrigger>
        </TabsList>
      </Tabs>
      {view.tab === "industries" ? <IndustriesPanel /> : <CountriesPanel />}
    </div>
  );
}

// Countries -----------------------------------------------------------------------------------

function CountriesPanel() {
  const { data, isPending, error, refetch } = useCountries();
  const update = useUpdateCountry();
  const [adding, setAdding] = React.useState(false);
  // A new key each time the dialog opens: it starts from an empty form while the last one animates out
  const [addKey, setAddKey] = React.useState(0);
  const [editing, setEditing] = React.useState<Country | null>(null);
  const startAdding = () => {
    setAddKey((key) => key + 1);
    setAdding(true);
  };

  const columns: Column<Country>[] = [
    {
      key: "name",
      header: "País",
      cell: (row) => (
        <span className="inline-flex items-center gap-2 font-medium">
          {row.code ? <CountryFlag code={row.code} className="h-3.5 w-5" /> : null}
          {row.name}
        </span>
      ),
    },
    { key: "code", header: "Código", cell: (row) => <span className="font-mono text-sm">{row.code ?? "—"}</span> },
    {
      key: "active",
      header: "Se ofrece",
      cell: (row) => (
        <Switch
          checked={row.is_active}
          disabled={update.isPending}
          onCheckedChange={(checked) => update.mutate({ id: row.id, is_active: checked })}
          aria-label={`${row.name} se ofrece al registrarse`}
        />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) => (
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setEditing(row)}>
          <Pencil /> Editar
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Cada país fija el reloj y la divisa con que arranca un negocio nuevo.</p>
        <Button size="sm" onClick={startAdding}>
          <Plus /> Agregar país
        </Button>
      </div>
      <DataTable columns={columns} rows={data ?? []} rowKey={(row) => row.id} isLoading={isPending} error={error} onRetry={() => refetch()} noun="países" />
      <CountryDialog key={addKey} open={adding} onOpenChange={setAdding} />
      {editing ? <CountryDialog key={editing.id} country={editing} open onOpenChange={(open) => !open && setEditing(null)} /> : null}
    </section>
  );
}

function CountryDialog({ country, open, onOpenChange }: { country?: Country; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = React.useState(country?.name ?? "");
  const [code, setCode] = React.useState(country?.code ?? "");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const create = useCreateCountry({ onSuccess: () => onOpenChange(false) });
  const update = useUpdateCountry({ onSuccess: () => onOpenChange(false) });
  const mutation = country ? update : create;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError("Escribe el nombre del país.");
      return;
    }
    setLocalError(null);
    if (country) update.mutate({ id: country.id, name: name.trim(), code: code.trim().toUpperCase() || null });
    else create.mutate({ name: name.trim(), code: code.trim().toUpperCase() });
  };

  const nameError = localError ?? fieldError(mutation.error, "name");
  const codeError = fieldError(mutation.error, "code");

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{country ? `Editar ${country.name}` : "Agregar país"}</DialogTitle>
            <DialogDescription>El código es el ISO de dos letras («BO», «AR»): con él la app dibuja la bandera y elige el reloj y la divisa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field htmlFor="country-name" label="Nombre">
              <Input id="country-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!nameError} aria-describedby={nameError ? "country-name-error" : undefined} />
              <FieldError id="country-name-error">{nameError}</FieldError>
            </Field>
            <Field htmlFor="country-code" label="Código">
              <Input id="country-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={5} className="font-mono uppercase" aria-invalid={!!codeError} aria-describedby={codeError ? "country-code-error" : undefined} />
              <FieldError id="country-code-error">{codeError}</FieldError>
            </Field>
          </div>
          {mutation.isError && !nameError && !codeError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(mutation.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {country ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Industries ----------------------------------------------------------------------------------

function IndustriesPanel() {
  const { data, isPending, error, refetch } = useIndustries();
  const update = useUpdateIndustry();
  const [adding, setAdding] = React.useState(false);
  const [addKey, setAddKey] = React.useState(0);
  const [editing, setEditing] = React.useState<Industry | null>(null);
  const startAdding = () => {
    setAddKey((key) => key + 1);
    setAdding(true);
  };

  const columns: Column<Industry>[] = [
    { key: "name", header: "Rubro", cell: (row) => <span className="font-medium">{row.name}</span> },
    {
      key: "active",
      header: "Se ofrece",
      cell: (row) => (
        <Switch
          checked={row.is_active}
          disabled={update.isPending}
          onCheckedChange={(checked) => update.mutate({ id: row.id, is_active: checked })}
          aria-label={`${row.name} se ofrece al registrarse`}
        />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) => (
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setEditing(row)}>
          <Pencil /> Renombrar
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Los rubros que el registro sugiere: restaurante, cafetería, pizzería…</p>
        <Button size="sm" onClick={startAdding}>
          <Plus /> Agregar rubro
        </Button>
      </div>
      <DataTable columns={columns} rows={data ?? []} rowKey={(row) => row.id} isLoading={isPending} error={error} onRetry={() => refetch()} noun="rubros" emptyTitle="Todavía no hay rubros" emptyMessage="Agrega los que el registro debería sugerir." />
      <IndustryDialog key={addKey} open={adding} onOpenChange={setAdding} />
      {editing ? <IndustryDialog key={editing.id} industry={editing} open onOpenChange={(open) => !open && setEditing(null)} /> : null}
    </section>
  );
}

function IndustryDialog({ industry, open, onOpenChange }: { industry?: Industry; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = React.useState(industry?.name ?? "");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const create = useCreateIndustry({ onSuccess: () => onOpenChange(false) });
  const update = useUpdateIndustry({ onSuccess: () => onOpenChange(false) });
  const mutation = industry ? update : create;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setLocalError("Escribe el nombre del rubro.");
      return;
    }
    setLocalError(null);
    if (industry) update.mutate({ id: industry.id, name: name.trim() });
    else create.mutate({ name: name.trim() });
  };

  const nameError = localError ?? fieldError(mutation.error, "name");

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{industry ? `Renombrar ${industry.name}` : "Agregar rubro"}</DialogTitle>
            <DialogDescription>Como lo verá quien registra su negocio.</DialogDescription>
          </DialogHeader>
          <Field htmlFor="industry-name" label="Nombre">
            <Input id="industry-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!nameError} aria-describedby={nameError ? "industry-name-error" : undefined} />
            <FieldError id="industry-name-error">{nameError}</FieldError>
          </Field>
          {mutation.isError && !nameError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(mutation.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {industry ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { Parameters };
