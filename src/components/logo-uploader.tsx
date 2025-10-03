
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLogo } from '@/context/logo-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Trash2, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      await setLogoUrl(dataUrl);
      setIsProcessing(false);
      setIsOpen(false);
      toast({ title: 'Logo mis à jour', description: 'Le nouveau logo a été sauvegardé.' });
    };
    reader.onerror = () => {
        setIsProcessing(false);
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de lire le fichier.' });
    }
    reader.readAsDataURL(file);
  };
  
  const handleUrlSave = async () => {
    if(!logoUrlInput) {
        toast({ variant: 'destructive', title: 'URL manquante', description: 'Veuillez entrer une URL.' });
        return;
    }
    await setLogoUrl(logoUrlInput);
    setIsOpen(false);
    toast({ title: 'Logo mis à jour', description: 'Le nouveau logo a été sauvegardé.' });
  }

  const handleResetToDefault = async () => {
    await setLogoUrl(null);
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
              Téléversez une nouvelle image ou utilisez une URL pour définir le logo de l'application. La sauvegarde est permanente.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Téléverser</TabsTrigger>
                <TabsTrigger value="url">Depuis une URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="py-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="picture">Logo</Label>
                    <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} disabled={isLoading}/>
                </div>
                {isLoading && <div className="flex items-center justify-center mt-4"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Traitement...</div>}
            </TabsContent>
            <TabsContent value="url" className="py-4">
                 <div className="space-y-2">
                    <Label htmlFor="logo-url">URL de l'image</Label>
                    <Input id="logo-url" value={logoUrlInput} onChange={(e) => setLogoUrlInput(e.target.value)} placeholder="https://example.com/logo.png" />
                 </div>
                 <Button onClick={handleUrlSave} className="mt-4 w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Sauvegarde...</> : "Enregistrer l'URL"}
                 </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="sm:justify-between pt-4">
            <Button variant="destructive" onClick={handleResetToDefault} disabled={isDefaultLogo || isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Réinitialisation...</> : <><Trash2 className="mr-2 h-4 w-4"/> Réinitialiser</>}
            </Button>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
