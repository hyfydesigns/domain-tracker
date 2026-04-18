"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DomainForm, type DomainFormValues } from "./domain-form";
import { useDomainStore } from "@/store/domain-store";
import { useToast } from "@/hooks/use-toast";
import type { Domain } from "@/types";

interface EditDomainDialogProps {
  domain: Domain;
  open: boolean;
  onClose: () => void;
}

export function EditDomainDialog({ domain, open, onClose }: EditDomainDialogProps) {
  const updateDomain = useDomainStore((s) => s.updateDomain);
  const { toast } = useToast();

  function handleSubmit(values: DomainFormValues) {
    updateDomain(domain.id, {
      name: values.name,
      registrar: values.registrar,
      purchaseDate: values.purchaseDate,
      expiryDate: values.expiryDate,
      renewalCost: values.renewalCost,
      autoRenew: values.autoRenew,
      notes: values.notes,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    toast({ title: "Domain updated", description: `${values.name} was saved successfully.` });
    onClose();
  }

  const defaultValues: Partial<DomainFormValues> = {
    name: domain.name,
    registrar: domain.registrar,
    purchaseDate: domain.purchaseDate,
    expiryDate: domain.expiryDate,
    renewalCost: domain.renewalCost,
    autoRenew: domain.autoRenew,
    notes: domain.notes,
    tags: domain.tags.join(", "),
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Domain</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <DomainForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Save Changes"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
