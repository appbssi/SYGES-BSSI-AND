
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { Mission } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { missionDoc } from "@/firebase/firestore/missions";
import { useAuth } from "@/context/auth-context";

interface ExtendMissionDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  mission: Mission;
}

export function ExtendMissionDialog({ isOpen, setIsOpen, mission }: ExtendMissionDialogProps) {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  
  const [newEndDate, setNewEndDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (isOpen) {
      setNewEndDate(new Date(mission.endDate));
    }
  }, [isOpen, mission.endDate]);

  const handleSave = async () => {
    if (!newEndDate) {
      toast({
        variant: "destructive",
        title: "Date invalide",
        description: "Veuillez sélectionner une nouvelle date de fin.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const missionRef = missionDoc(firestore, mission.id);
      await updateDoc(missionRef, {
        endDate: newEndDate.toISOString(),
      });
      toast({
        title: "Mission prolongée",
        description: `La mission "${mission.name}" a été prolongée jusqu'au ${format(newEndDate, "dd/MM/yyyy")}.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error extending mission:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de prolonger la mission.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prolonger la Mission</DialogTitle>
          <DialogDescription>
            Sélectionnez la nouvelle date de fin pour la mission &quot;{mission.name}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex justify-center">
          <Calendar
            mode="single"
            selected={newEndDate}
            onSelect={setNewEndDate}
            disabled={isViewer || { before: new Date(mission.startDate) }}
            initialFocus
            locale={fr}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isViewer}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sauvegarde...</> : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
