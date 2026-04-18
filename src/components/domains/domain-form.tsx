"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REGISTRARS } from "@/lib/utils";
import type { Domain } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Domain name is required").toLowerCase(),
  registrar: z.string().min(1, "Registrar is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  renewalCost: z.coerce.number().min(0, "Must be 0 or more"),
  autoRenew: z.boolean(),
  notes: z.string(),
  tags: z.string(),
});

export type DomainFormValues = z.infer<typeof schema>;

interface DomainFormProps {
  defaultValues?: Partial<DomainFormValues>;
  onSubmit: (values: DomainFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export function DomainForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", loading }: DomainFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DomainFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      registrar: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      renewalCost: 12.99,
      autoRenew: false,
      notes: "",
      tags: "",
      ...defaultValues,
    },
  });

  const autoRenew = watch("autoRenew");
  const registrar = watch("registrar");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Domain name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Domain Name</Label>
        <Input
          id="name"
          placeholder="example.com"
          {...register("name")}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Registrar */}
      <div className="space-y-1.5">
        <Label>Registrar</Label>
        <Select value={registrar} onValueChange={(v) => setValue("registrar", v)}>
          <SelectTrigger className={errors.registrar ? "border-destructive" : ""}>
            <SelectValue placeholder="Select registrar…" />
          </SelectTrigger>
          <SelectContent>
            {REGISTRARS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.registrar && <p className="text-xs text-destructive">{errors.registrar.message}</p>}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            {...register("expiryDate")}
            className={errors.expiryDate ? "border-destructive" : ""}
          />
          {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate.message}</p>}
        </div>
      </div>

      {/* Cost */}
      <div className="space-y-1.5">
        <Label htmlFor="renewalCost">Annual Renewal Cost (USD)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            id="renewalCost"
            type="number"
            step="0.01"
            min="0"
            className="pl-7"
            {...register("renewalCost")}
          />
        </div>
        {errors.renewalCost && <p className="text-xs text-destructive">{errors.renewalCost.message}</p>}
      </div>

      {/* Auto-renew */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
        <div>
          <Label htmlFor="autoRenew" className="cursor-pointer">Auto-Renew</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Automatically renew before expiry</p>
        </div>
        <Switch
          id="autoRenew"
          checked={autoRenew}
          onCheckedChange={(v) => setValue("autoRenew", v)}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="primary, brand, marketing (comma-separated)"
          {...register("tags")}
        />
        <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any notes about this domain…"
          rows={3}
          {...register("notes")}
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
