
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Mission } from "@/lib/types";
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
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { fr } from "date-fns/locale";
import { addDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { missionsCollection } from "@/firebase/firestore/missions";

interface MissionFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mission: Mission | null; // Mission update is not implemented, so this will be null
}

const missionSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  description: z.string().min(1, "La description est requise."),
  startDate: z.date({ required_error: "La date de début est requise."}),
  endDate: z.date({ required_error: "La date de fin est requise."}),
}).refine(data => data.startDate < data.endDate, {
    message: "La date de fin doit être après la date de début.",
    path: ["endDate"],
});


type FormValues = z.infer<typeof missionSchema>;


export function MissionForm({ isOpen, setIsOpen, mission }: MissionFormProps) {
  const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm<FormValues>({
      resolver: zodResolver(missionSchema),
  });
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      reset({
        name: '',
        description: '',
        startDate: today,
        endDate: nextWeek,
      });
    }
  }, [isOpen, reset]);
  

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
        const missionsRef = missionsCollection(firestore);
        await addDoc(missionsRef, {
            ...data,
            startDate: data.startDate.toISOString(),
            endDate: data.endDate.toISOString(),
            agentIds: [],
        });
        toast({
            title: `Mission Créée`,
            description: `La mission "${data.name}" a été créée avec succès.`,
        });
        setIsOpen(false);
    } catch (error) {
        console.error("Erreur lors de la création de la mission: ", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Une erreur est survenue lors de la création de la mission."
        });
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une Nouvelle Mission</DialogTitle>
          <DialogDescription>
            Saisissez les informations de la nouvelle mission.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nom</Label>
            <div className="col-span-3">
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} className="w-full" />}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right mt-2">Description</Label>
             <div className="col-span-3">
               <Controller
                name="description"
                control={control}
                render={({ field }) => <Textarea id="description" {...field} className="w-full" />}
              />
               {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Période</Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
                 <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                name={field.name}
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Date de début</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                locale={fr}
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                 />
                 <Controller
                    name="endDate"
                    control={control}
                    render={({ field: { name, value, onChange } }) => (
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                name={name}
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value ? format(value, "dd/MM/yyyy") : <span>Date de fin</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={value}
                                onSelect={onChange}
                                disabled={{ before: getValues("startDate") }}
                                initialFocus
                                locale={fr}
                            />
                            </PopoverContent>
                        </Popover>
                    )}
                 />
            </div>
          </div>
          {(errors.startDate || errors.endDate) && (
              <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                    {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                  </div>
              </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...</> : 'Créer la Mission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
