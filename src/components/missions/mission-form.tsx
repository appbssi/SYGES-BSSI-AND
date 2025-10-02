
"use client";

import { useEffect, useActionState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { createMissionAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";
import { fr } from "date-fns/locale";

interface MissionFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mission: Mission | null; // Mission update is not implemented, so this will be null
}

const initialState: { errors: Record<string, string[]>, message?: string } = {
  errors: {},
};

type FormValues = {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
};


export function MissionForm({ isOpen, setIsOpen, mission }: MissionFormProps) {
  const { control, reset, getValues, formState: { errors } } = useForm<FormValues>();
  
  const [state, formAction, isPending] = useActionState(createMissionAction, initialState);

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
  
  useEffect(() => {
    if (state.message === 'success') {
       toast({
        title: `Mission Créée`,
        description: `La mission a été créée avec succès.`,
      });
      setIsOpen(false);
    }
  }, [state, setIsOpen, toast]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une Nouvelle Mission</DialogTitle>
          <DialogDescription>
            Saisissez les informations de la nouvelle mission.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nom</Label>
            <div className="col-span-3">
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" {...field} className="w-full" />}
              />
              {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>}
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
               {state.errors?.description && <p className="text-red-500 text-xs mt-1">{state.errors.description[0]}</p>}
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
                            <input type="hidden" name="startDate" value={field.value?.toISOString()}/>
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
                             <input type="hidden" name="endDate" value={value?.toISOString()}/>
                            </PopoverContent>
                        </Popover>
                    )}
                 />
            </div>
          </div>
          {(state.errors?.startDate || state.errors?.endDate) && (
              <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    {state.errors?.startDate && <p className="text-red-500 text-xs mt-1">{state.errors.startDate[0]}</p>}
                    {state.errors?.endDate && <p className="text-red-500 text-xs mt-1">{state.errors.endDate[0]}</p>}
                  </div>
              </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Création...' : 'Créer la Mission'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
