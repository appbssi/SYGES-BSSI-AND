
"use client";

import { useEffect, useActionState } from "react";
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
import { createAgentAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

interface AgentFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agent: Agent | null; // For now, only creation is handled.
}

const initialState: { errors: Record<string, string[]>, message?: string } = {
  errors: {},
};

export function AgentForm({ isOpen, setIsOpen, agent }: AgentFormProps) {
  const [state, formAction, isPending] = useActionState(createAgentAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message === 'success') {
      toast({
        title: agent ? "Agent Modifié" : "Agent Créé",
        description: `L'agent a été ${agent ? "modifié" : "créé"} avec succès.`,
      });
      setIsOpen(false);
    } else if (state.message && state.message.startsWith('Erreur')) {
       toast({
        title: "Erreur Serveur",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, setIsOpen, toast, agent]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{agent ? "Modifier l'Agent" : "Créer un Nouvel Agent"}</DialogTitle>
          <DialogDescription>
            Saisissez les informations de l'agent.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          {/* We can pass the ID if we are editing */}
          {agent?.id && <input type="hidden" name="id" value={agent.id} />}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">Prénom</Label>
            <div className="col-span-3">
              <Input id="firstName" name="firstName" defaultValue={agent?.firstName} />
              {state.errors?.firstName && <p className="text-red-500 text-xs mt-1">{state.errors.firstName[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">Nom</Label>
            <div className="col-span-3">
              <Input id="lastName" name="lastName" defaultValue={agent?.lastName} />
               {state.errors?.lastName && <p className="text-red-500 text-xs mt-1">{state.errors.lastName[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registrationNumber" className="text-right">Matricule</Label>
            <div className="col-span-3">
              <Input id="registrationNumber" name="registrationNumber" defaultValue={agent?.registrationNumber} />
               {state.errors?.registrationNumber && <p className="text-red-500 text-xs mt-1">{state.errors.registrationNumber[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rank" className="text-right">Grade</Label>
            <div className="col-span-3">
              <Input id="rank" name="rank" defaultValue={agent?.rank} />
              {state.errors?.rank && <p className="text-red-500 text-xs mt-1">{state.errors.rank[0]}</p>}
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactNumber" className="text-right">Contact</Label>
            <div className="col-span-3">
              <Input id="contactNumber" name="contactNumber" defaultValue={agent?.contactNumber} />
              {state.errors?.contactNumber && <p className="text-red-500 text-xs mt-1">{state.errors.contactNumber[0]}</p>}
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Adresse</Label>
            <div className="col-span-3">
              <Input id="address" name="address" defaultValue={agent?.address} />
              {state.errors?.address && <p className="text-red-500 text-xs mt-1">{state.errors.address[0]}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (agent ? 'Modification...' : 'Création...') : (agent ? 'Enregistrer les Modifications' : 'Créer l\'Agent')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
