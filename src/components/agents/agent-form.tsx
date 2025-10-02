"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { useFirestore }from "@/firebase";
import { addDoc } from "firebase/firestore";
import { agentsCollection } from "@/firebase/firestore/agents";
import { Loader2 } from "lucide-react";


interface AgentFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const agentSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom de famille est requis."),
  registrationNumber: z.string().min(1, "Le matricule est requis."),
  rank: z.string().min(1, "Le grade est requis."),
  contactNumber: z.string().min(1, "Le numéro de contact est requis."),
  address: z.string().min(1, "L'adresse est requise."),
});

type AgentFormData = z.infer<typeof agentSchema>;

export function AgentForm({ isOpen, setIsOpen }: AgentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitSuccessful } } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema)
  });

  useEffect(() => {
    if (isSubmitSuccessful) {
        reset();
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    try {
        const agentsRef = agentsCollection(firestore);
        await addDoc(agentsRef, data);

        toast({
            title: "Agent Créé",
            description: `L'agent ${data.firstName} ${data.lastName} a été créé avec succès.`,
        });
        setIsOpen(false);
    } catch (error) {
        console.error("Error creating agent:", error);
        toast({
            title: "Erreur",
            description: "Impossible de créer l'agent.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
            reset();
        }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un Nouvel Agent</DialogTitle>
          <DialogDescription>
            Saisissez les informations de l'agent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">Prénom</Label>
            <div className="col-span-3">
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">Nom</Label>
            <div className="col-span-3">
              <Input id="lastName" {...register("lastName")} />
               {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registrationNumber" className="text-right">Matricule</Label>
            <div className="col-span-3">
              <Input id="registrationNumber" {...register("registrationNumber")} />
               {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rank" className="text-right">Grade</Label>
            <div className="col-span-3">
              <Input id="rank" {...register("rank")} />
              {errors.rank && <p className="text-red-500 text-xs mt-1">{errors.rank.message}</p>}
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactNumber" className="text-right">Contact</Label>
            <div className="col-span-3">
              <Input id="contactNumber" {...register("contactNumber")} />
              {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>}
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Adresse</Label>
            <div className="col-span-3">
              <Input id="address" {...register("address")} />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : 'Créer l\'Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
