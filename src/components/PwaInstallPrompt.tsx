import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export const PwaInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if it's already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            || (navigator as any).standalone
            || document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) {
            if (isIOS) {
                toast.info('Para instalar no iPhone: Toque em "Compartilhar" e depois em "Adicionar à Tela de Início".', { duration: 6000 });
            } else {
                toast.info('O aplicativo já está instalado ou seu navegador não suporta a instalação automática.');
            }
            return;
        }

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            setInstallPrompt(null);
            toast.success('Instalação iniciada!');
        }
    };

    if (isStandalone) {
        return null; // Don't show if already installed
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            className="hidden sm:flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary"
        >
            <Download className="w-4 h-4" />
            <span>Instalar App</span>
        </Button>
    );
};
