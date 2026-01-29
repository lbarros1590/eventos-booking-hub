import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { toast } from 'sonner';
import { Settings, DollarSign, Percent, Loader2, FileText } from 'lucide-react';
import GalleryManager from './GalleryManager';

const AdminSettings = () => {
  const { settings, loading, updateSettings, refreshSettings } = useVenueSettings();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    base_price_weekday: 400,
    base_price_weekend: 600,
    cleaning_fee: 70,
    global_discount_percent: 0,
    payment_terms_text: '50% no ato da reserva, 50% na entrega das chaves.',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        base_price_weekday: settings.base_price_weekday,
        base_price_weekend: settings.base_price_weekend,
        cleaning_fee: settings.cleaning_fee,
        global_discount_percent: settings.global_discount_percent,
        payment_terms_text: settings.payment_terms_text || '50% no ato da reserva, 50% na entrega das chaves.',
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'payment_terms_text') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateSettings(formData as any);
    
    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas com sucesso!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie preços, taxas, galeria e termos
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Preços e Taxas
            </CardTitle>
            <CardDescription>
              Configure os valores das diárias e taxas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weekday">Diária (Seg-Qui)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="weekday"
                    type="number"
                    value={formData.base_price_weekday}
                    onChange={(e) => handleInputChange('base_price_weekday', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekend">Diária (Sex-Dom)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="weekend"
                    type="number"
                    value={formData.base_price_weekend}
                    onChange={(e) => handleInputChange('base_price_weekend', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaning">Taxa de Limpeza</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="cleaning"
                  type="number"
                  value={formData.cleaning_fee}
                  onChange={(e) => handleInputChange('cleaning_fee', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              Promoções
            </CardTitle>
            <CardDescription>
              Configure descontos globais para todas as reservas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto Global (%)</Label>
              <div className="relative">
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.global_discount_percent}
                  onChange={(e) => handleInputChange('global_discount_percent', e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Este desconto será aplicado automaticamente em todas as reservas
              </p>
            </div>

            {formData.global_discount_percent > 0 && (
              <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-sm text-accent font-medium">
                  Desconto de {formData.global_discount_percent}% ativo!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Diária Seg-Qui: R$ {Math.round(formData.base_price_weekday * (1 - formData.global_discount_percent / 100))} | 
                  Diária Sex-Dom: R$ {Math.round(formData.base_price_weekend * (1 - formData.global_discount_percent / 100))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Termos de Pagamento
            </CardTitle>
            <CardDescription>
              Texto exibido no contrato e na reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.payment_terms_text}
              onChange={(e) => handleInputChange('payment_terms_text', e.target.value)}
              placeholder="Ex: 50% no ato da reserva, 50% na entrega das chaves."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Gallery Manager - Full width */}
        <div className="lg:col-span-2">
          <GalleryManager />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
