
"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
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
import { Slider } from "../ui/slider";

interface MissionFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mission: Mission | null;
}

const initialState = {
  errors: {},
};

export function MissionForm({ isOpen, setIsOpen, mission }: MissionFormProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting, errors } } = useForm();
  const formAction = mission ? (() => {}) : createMissionAction; // No update action for now
  const [state, dispatch] = useFormState(formAction, initialState);
  const { toast } = useToast();
    const [defaultStartDate, setDefaultStartDate] = useState(new Date());
    const [defaultEndDate, setDefaultEndDate] = useState(new Date());


  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const priority = watch("priority");

  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    setDefaultStartDate(today);
    setDefaultEndDate(nextWeek);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      reset();
    } else if (mission) {
      reset({ ...mission, 
        startDate: new Date(mission.startDate),
        endDate: new Date(mission.endDate),
      });
    } else {
      reset({
        name: '',
        details: '',
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        priority: 3,
      });
    }
  }, [isOpen, mission, reset, defaultStartDate, defaultEndDate]);
  
  const onFormSubmit = (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Date) {
            formData.append(key, data[key].toISOString());
        } else {
            formData.append(key, data[key]);
        }
    });
    dispatch(formData);
  };
  
  useEffect(() => {
    if (state?.errors && Object.keys(state.errors).length > 0) {
      // Errors handled by react-hook-form and displayed below fields
    } else if (!isSubmitting && isOpen && state && !state.errors) {
       toast({
        title: `Mission Créée`,
        description: `La mission a été créée avec succès.`,
      });
      setIsOpen(false);
    }
  }, [state, isSubmitting, isOpen, setIsOpen, toast]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mission ? "Modifier la Mission" : "Créer une Nouvelle Mission"}</DialogTitle>
          <DialogDescription>
            {mission ? "Mettez à jour les informations de cette mission." : "Saisissez les informations de la nouvelle mission."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nom</Label>
            <div className="col-span-3">
              <Input id="name" {...register("name")} className="w-full" />
              {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="details" className="text-right mt-2">Détails</Label>
             <div className="col-span-3">
              <Textarea id="details" {...register("details")} className="w-full" />
               {state.errors?.details && <p className="text-red-500 text-xs mt-1">{state.errors.details[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Période</Label>
            <div className="col-span-3 grid grid-cols-2 gap-2">
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : <span>Date de début</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => setValue("startDate", date, { shouldValidate: true })}
                        initialFocus
                        locale={fr}
                    />
                    </PopoverContent>
                </Popover>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : <span>Date de fin</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => setValue("endDate", date, { shouldValidate: true })}
                        disabled={{ before: startDate }}
                        initialFocus
                        locale={fr}
                    />
                    </PopoverContent>
                </Popover>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">Priorité</Label>
            <div className="col-span-3 flex items-center gap-4">
              <Slider
                id="priority"
                min={1} max={5}
                defaultValue={[priority || 3]}
                onValueChange={(value) => setValue("priority", value[0])}
              />
              <span className="w-8 text-center font-bold">{priority || 3}</span>
            </div>
            <input type="hidden" {...register("priority")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Création...' : 'Créer la Mission'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
