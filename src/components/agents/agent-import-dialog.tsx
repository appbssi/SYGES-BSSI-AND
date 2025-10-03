
"use client";

import { useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { read, utils, WorkBook, WorkSheet } from "xlsx";
import { Agent } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { agentsCollection } from "@/firebase/firestore/agents";
import { writeBatch, getDocs, query, where, collection, doc } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";

interface AgentImportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  existingAgents: Agent[];
}

type AgentToImport = Omit<Agent, "id"> & { validation: { valid: boolean; message: string } };

export function AgentImportDialog({ isOpen, setIsOpen, existingAgents }: AgentImportDialogProps) {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  
  const [file, setFile] = useState<File | null>(null);
  const [agentsToImport, setAgentsToImport] = useState<AgentToImport[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setAgentsToImport([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook: WorkBook = read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet: WorkSheet = workbook.Sheets[sheetName];
      const json: any[] = utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        toast({ variant: 'destructive', title: 'Fichier Vide', description: 'Aucune donnée trouvée dans le fichier Excel.' });
        setIsProcessing(false);
        return;
      }
      
      const requiredHeaders = ["firstName", "lastName", "registrationNumber", "rank", "contactNumber", "address"];
      const actualHeaders = Object.keys(json[0]);
      const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));

      if (missingHeaders.length > 0) {
          toast({ variant: 'destructive', title: 'Colonnes manquantes', description: `Les colonnes suivantes sont requises: ${missingHeaders.join(', ')}` });
          setIsProcessing(false);
          return;
      }

      const validatedAgents: AgentToImport[] = json.map((row, index) => {
        const registrationNumber = String(row.registrationNumber || "");
        const contactNumber = String(row.contactNumber || "");
        
        let validation = { valid: true, message: "Prêt pour l'import" };

        if (!registrationNumber || !contactNumber || !row.firstName || !row.lastName || !row.rank || !row.address) {
            validation = { valid: false, message: 'Données manquantes.' };
        } else if (existingAgents.some(a => a.registrationNumber === registrationNumber)) {
            validation = { valid: false, message: `Matricule ${registrationNumber} déjà existant.` };
        } else if (existingAgents.some(a => a.contactNumber === contactNumber)) {
            validation = { valid: false, message: `Contact ${contactNumber} déjà existant.` };
        } else if (json.slice(0, index).some(p => String(p.registrationNumber) === registrationNumber)) {
             validation = { valid: false, message: `Matricule ${registrationNumber} dupliqué dans le fichier.` };
        } else if (json.slice(0, index).some(p => String(p.contactNumber) === contactNumber)) {
             validation = { valid: false, message: `Contact ${contactNumber} dupliqué dans le fichier.` };
        }

        return {
          firstName: row.firstName,
          lastName: row.lastName,
          registrationNumber: registrationNumber,
          rank: row.rank,
          contactNumber: contactNumber,
          address: row.address,
          validation,
        };
      });

      setAgentsToImport(validatedAgents);

    } catch (error) {
      console.error("Error processing file:", error);
      toast({ variant: "destructive", title: "Erreur de lecture", description: "Impossible de lire le fichier Excel." });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleImport = async () => {
    if (isViewer) return;
    const validAgents = agentsToImport.filter(a => a.validation.valid);
    if (validAgents.length === 0) {
        toast({ variant: "destructive", title: "Aucun agent valide", description: "Aucun agent ne peut être importé." });
        return;
    }
    
    setIsSaving(true);
    try {
        const agentsRef = agentsCollection(firestore);
        const batch = writeBatch(firestore);

        validAgents.forEach(agentData => {
            const { validation, ...newAgent } = agentData;
            const newDocRef = doc(agentsRef);
            batch.set(newDocRef, newAgent);
        });
        
        await batch.commit();

        toast({ title: "Importation réussie", description: `${validAgents.length} agents ont été ajoutés.` });
        resetState();
        setIsOpen(false);
    } catch (error) {
        console.error("Error importing agents:", error);
        toast({ variant: "destructive", title: "Erreur d'importation", description: "Une erreur est survenue lors de l'enregistrement." });
    } finally {
        setIsSaving(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setAgentsToImport([]);
    setIsProcessing(false);
    setIsSaving(false);
  };
  
  const handleClose = () => {
      resetState();
      setIsOpen(false);
  }

  const validCount = agentsToImport.filter(a => a.validation.valid).length;
  const invalidCount = agentsToImport.length - validCount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importer des Agents depuis Excel</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier .xlsx ou .csv. Les colonnes requises sont: firstName, lastName, registrationNumber, rank, contactNumber, address.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
            <Label htmlFor="agent-file" className="sr-only">Fichier agents</Label>
            <Input id="agent-file" type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" disabled={isProcessing || isSaving} />
        </div>
        
        {isProcessing && <div className="flex items-center justify-center flex-1"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-2">Analyse du fichier...</p></div>}
        
        {agentsToImport.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <Alert variant={validCount > 0 ? "default" : "destructive"} className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 !text-green-600" />
                        <AlertTitle className="text-green-800 dark:text-green-300">Agents Valides</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                            {validCount} agent(s) prêt(s) pour l'importation.
                        </AlertDescription>
                    </Alert>
                    <Alert variant={invalidCount > 0 ? "destructive" : "default"} className={invalidCount > 0 ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800" : ""}>
                        <XCircle className="h-4 w-4" />
                        <AlertTitle className={invalidCount > 0 ? "text-red-800 dark:text-red-300" : ""}>Agents Invalides</AlertTitle>
                        <AlertDescription className={invalidCount > 0 ? "text-red-700 dark:text-red-400" : ""}>
                            {invalidCount} agent(s) ne peuvent pas être importés.
                        </AlertDescription>
                    </Alert>
                </div>
                <ScrollArea className="border rounded-md flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Matricule</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agentsToImport.map((agent, index) => (
                                <TableRow key={index}>
                                    <TableCell>{agent.firstName} {agent.lastName}</TableCell>
                                    <TableCell>{agent.registrationNumber}</TableCell>
                                    <TableCell>{agent.contactNumber}</TableCell>
                                    <TableCell>
                                        {agent.validation.valid ? (
                                            <span className="flex items-center text-sm text-green-600"><CheckCircle2 className="h-4 w-4 mr-2" /> Valide</span>
                                        ) : (
                                            <span className="flex items-center text-sm text-red-600" title={agent.validation.message}><XCircle className="h-4 w-4 mr-2" /> {agent.validation.message}</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        )}

        {!isProcessing && agentsToImport.length === 0 && (
             <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <FileUp className="w-12 h-12 mb-4" />
                <h3 className="font-semibold">En attente d'un fichier</h3>
                <p className="text-sm">Sélectionnez un fichier pour commencer l'importation.</p>
            </div>
        )}

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button type="button" onClick={handleImport} disabled={isSaving || isProcessing || validCount === 0 || isViewer}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importation...</> : <>Importer {validCount} Agent(s)</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    