
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { addDoc, getDocs, query, where } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { agentsCollection } from "@/firebase/firestore/agents";
import { Loader2 } from "lucide-react";

interface AgentFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agent: Agent | null; // For now, only handles creation
}

const agentSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  registrationNumber: z.string().min(1, "Le matricule est requis."),
  rank: z.string().min(1, "Le grade est requis."),
  contactNumber: z.string().min(1, "Le contact est requis."),
  address: z.string().min(1, "L'adresse est requise."),
});

type FormValues = z.infer<typeof agentSchema>;

export function AgentForm({ isOpen, setIsOpen, agent }: AgentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, reset, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      registrationNumber: "",
      rank: "",
      contactNumber: "",
      address: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: "",
        lastName: "",
        registrationNumber: "",
        rank: "",
        contactNumber: "",
        address: "",
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    
    const agentsRef = agentsCollection(firestore);

    // Check if registration number is unique
    const qReg = query(agentsRef, where("registrationNumber", "==", data.registrationNumber));
    const querySnapshotReg = await getDocs(qReg);

    if (!querySnapshotReg.empty) {
        setError("registrationNumber", { type: "manual", message: "Ce matricule est déjà utilisé." });
        setIsSaving(false);
        return;
    }

    // Check if contact number is unique
    const qContact = query(agentsRef, where("contactNumber", "==", data.contactNumber));
    const querySnapshotContact = await getDocs(qContact);
    
    if (!querySnapshotContact.empty) {
        setError("contactNumber", { type: "manual", message: "Ce contact est déjà utilisé." });
        setIsSaving(false);
        return;
    }

    try {
      await addDoc(agentsRef, data);
      toast({
        title: "Agent Ajouté",
        description: `L'agent ${data.firstName} ${data.lastName} a été ajouté avec succès.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding agent: ", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'agent.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un Nouvel Agent</DialogTitle>
          <DialogDescription>
            Saisissez les informations du nouvel agent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => <Input id="firstName" {...field} />}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => <Input id="lastName" {...field} />}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Matricule</Label>
            <Controller
              name="registrationNumber"
              control={control}
              render={({ field }) => <Input id="registrationNumber" {...field} />}
            />
            {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rank">Grade</Label>
            <Controller
              name="rank"
              control={control}
              render={({ field }) => <Input id="rank" {...field} />}
            />
            {errors.rank && <p className="text-red-500 text-xs mt-1">{errors.rank.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact</Label>
            <Controller
              name="contactNumber"
              control={control}
              render={({ field }) => <Input id="contactNumber" {...field} />}
            />
            {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Controller
              name="address"
              control={control}
              render={({ field }) => <Input id="address" {...field} />}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : 'Ajouter l\'Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
