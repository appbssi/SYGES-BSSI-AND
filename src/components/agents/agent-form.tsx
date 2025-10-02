"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
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

const initialState = {
  errors: {},
};

export function AgentForm({ isOpen, setIsOpen, agent }: AgentFormProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const formAction = agent ? updateAgentAction.bind(null, agent.id) : createAgentAction;
  const [state, dispatch] = useFormState(formAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      reset();
    } else if (agent) {
      reset({
        ...agent,
        skills: agent.skills.join(', ')
      });
    } else {
      reset({
        name: '',
        registrationNumber: '',
        rank: '',
        contact: '',
        address: '',
        skills: ''
      });
    }
  }, [isOpen, agent, reset]);
  
  const onFormSubmit = (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    dispatch(formData);
  };
  
  useEffect(() => {
    if (state?.errors && Object.keys(state.errors).length > 0) {
      // Errors are now displayed below inputs
    } else if (!isSubmitting && isOpen && !state?.errors) {
       toast({
        title: `Agent ${agent ? 'Updated' : 'Created'}`,
        description: `Agent ${agent?.name || ''} has been successfully ${agent ? 'updated' : 'created'}.`,
      });
      setIsOpen(false);
    }
  }, [state, isSubmitting]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{agent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
          <DialogDescription>
            {agent ? "Update the details for this agent." : "Enter the details for the new agent."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <div className="col-span-3">
              <Input id="name" {...register("name")} className="w-full" />
              {state.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="registrationNumber" className="text-right">Registration</Label>
             <div className="col-span-3">
              <Input id="registrationNumber" {...register("registrationNumber")} className="w-full" />
               {state.errors?.registrationNumber && <p className="text-red-500 text-xs mt-1">{state.errors.registrationNumber[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rank" className="text-right">Rank</Label>
            <div className="col-span-3">
              <Input id="rank" {...register("rank")} className="w-full" />
              {state.errors?.rank && <p className="text-red-500 text-xs mt-1">{state.errors.rank[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">Contact</Label>
            <div className="col-span-3">
              <Input id="contact" {...register("contact")} className="w-full" />
              {state.errors?.contact && <p className="text-red-500 text-xs mt-1">{state.errors.contact[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Address</Label>
            <div className="col-span-3">
              <Textarea id="address" {...register("address")} className="w-full" />
              {state.errors?.address && <p className="text-red-500 text-xs mt-1">{state.errors.address[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skills" className="text-right">Skills</Label>
            <div className="col-span-3">
              <Input id="skills" {...register("skills")} placeholder="Comma-separated skills" className="w-full" />
              {state.errors?.skills && <p className="text-red-500 text-xs mt-1">{state.errors.skills[0]}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Agent'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
