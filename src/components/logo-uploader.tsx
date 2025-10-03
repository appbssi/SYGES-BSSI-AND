
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLogo } from '@/context/logo-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Trash2 } from 'lucide-react';

export function LogoUploader() {
  const { user } = useAuth();
  const { setLogoUrl, isDefaultLogo, isLogoLoading } = useLogo();
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (user?.role !== 'admin') {
    return null;
  }

  const handleUrlSave = async () => {
    if(!logoUrlInput) {
        toast({ variant: 'destructive', title: 'URL manquante', description: 'Veuillez entrer une URL.' });
        return;
    }
    setIsProcessing(true);
    await setLogoUrl(logoUrlInput);
    setIsProcessing(false);
    setIsOpen(false);
    toast({ title: 'Logo mis à jour', description: 'Le nouveau logo a été sauvegardé.' });
  }

  const handleResetToDefault = async () => {
    setIsProcessing(true);
    await setLogoUrl(null);
    setIsProcessing(false);
    setIsOpen(false);
    toast({ title: 'Logo réinitialisé', description: 'Le logo par défaut a été restauré.' });
  }

  const isLoading = isProcessing || isLogoLoading;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-[-5px] right-[-5px] p-1 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-all opacity-80 hover:opacity-100"
        title="Changer le logo"
      >
        <Settings className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personnaliser le Logo</DialogTitle>
            <DialogDescription>
             Utilisez une URL pour définir le logo de l'application. Le logo est sauvegardé localement dans votre navigateur.
            </DialogDescription>
          </DialogHeader>

            <div className="py-4">
                 <div className="space-y-2">
                    <Label htmlFor="logo-url">URL de l'image</Label>
                    <Input id="logo-url" value={logoUrlInput} onChange={(e) => setLogoUrlInput(e.target.value)} placeholder="https://example.com/logo.png" disabled={isLoading}/>
                 </div>
                 <Button onClick={handleUrlSave} className="mt-4 w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Sauvegarde...</> : "Enregistrer l'URL"}
                 </Button>
            </div>

          <DialogFooter className="sm:justify-between pt-4">
            <Button variant="destructive" onClick={handleResetToDefault} disabled={isDefaultLogo || isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Réinitialisation...</> : <><Trash2 className="mr-2 h-4 w-4"/> Réinitialiser</>}
            </Button>
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
