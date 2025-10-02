
"use client";

import { useEffect, useActionState } from "react";
import { useForm } from "react-hook-form";
import type { Agent } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgentAction, updateAgentAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";

interface AgentFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agent: Agent | null;
}

const initialState: { errors: Record<string, string[]> } = {
  errors: {},
};

export function AgentForm({ isOpen, setIsOpen, agent }: AgentFormProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty, errors: clientErrors } } = useForm<Agent>({
      defaultValues: agent || {
        firstName: '',
        lastName: '',
        registrationNumber: '',
        rank: '',
        contactNumber: '',
        address: '',
      }
  });

  const [formState, formAction, isPending] = useActionState(
    agent ? updateAgentAction.bind(null, agent.id) : createAgentAction,
    initialState
  );

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        reset(agent || {
            firstName: '',
            lastName: '',
            registrationNumber: '',
            rank: '',
            contactNumber: '',
            address: '',
        });
    }
  }, [isOpen, agent, reset]);
  
  useEffect(() => {
    if (!isPending && isDirty && formState.errors && Object.keys(formState.errors).length === 0 && Object.keys(clientErrors).length === 0) {
       toast({
        title: `Agent ${agent ? 'Mis à Jour' : 'Créé'}`,
        description: `L'agent a été ${agent ? 'mis à jour' : 'créé'} avec succès.`,
      });
      setIsOpen(false);
      reset();
    }
  }, [formState, isPending, isDirty, agent, setIsOpen, toast, clientErrors, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{agent ? "Modifier l'Agent" : "Ajouter un Nouvel Agent"}</DialogTitle>
          <DialogDescription>
            {agent ? "Mettez à jour les informations de cet agent." : "Saisissez les informations du nouvel agent."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} onSubmit={handleSubmit((data) => {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
            formAction(formData);
        })} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">Prénom</Label>
            <div className="col-span-3">
              <Input id="firstName" {...register("firstName")} className="w-full" />
              {formState.errors?.firstName && <p className="text-red-500 text-xs mt-1">{formState.errors.firstName[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">Nom</Label>
            <div className="col-span-3">
              <Input id="lastName" {...register("lastName")} className="w-full" />
              {formState.errors?.lastName && <p className="text-red-500 text-xs mt-1">{formState.errors.lastName[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registrationNumber" className="text-right">Matricule</Label>
             <div className="col-span-3">
              <Input id="registrationNumber" {...register("registrationNumber")} className="w-full" />
               {formState.errors?.registrationNumber && <p className="text-red-500 text-xs mt-1">{formState.errors.registrationNumber[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rank" className="text-right">Grade</Label>
            <div className="col-span-3">
              <Input id="rank" {...register("rank")} className="w-full" />
              {formState.errors?.rank && <p className="text-red-500 text-xs mt-1">{formState.errors.rank[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactNumber" className="text-right">Contact</Label>
            <div className="col-span-3">
              <Input id="contactNumber" {...register("contactNumber")} className="w-full" />
              {formState.errors?.contactNumber && <p className="text-red-500 text-xs mt-1">{formState.errors.contactNumber[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Adresse</Label>
            <div className="col-span-3">
              <Textarea id="address" {...register("address")} className="w-full" />
              {formState.errors?.address && <p className="text-red-500 text-xs mt-1">{formState.errors.address[0]}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
