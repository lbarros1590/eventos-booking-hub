import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Upload, DollarSign, Percent, Image as ImageIcon, Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const { settings, loading, updateSettings, refreshSettings } = useVenueSettings();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    base_price_weekday: 400,
    base_price_weekend: 600,
    cleaning_fee: 70,
    global_discount_percent: 0,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        base_price_weekday: settings.base_price_weekday,
        base_price_weekend: settings.base_price_weekend,
        cleaning_fee: settings.cleaning_fee,
        global_discount_percent: settings.global_discount_percent,
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateSettings(formData);
    
    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas com sucesso!');
    }
    setSaving(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('venue-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('venue-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await updateSettings({ hero_image_url: publicUrl });

      if (updateError) throw updateError;

      toast.success('Imagem do hero atualizada!');
      await refreshSettings();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload da imagem');
    }

    setUploading(false);
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
          Gerencie preços, taxas e imagens do espaço
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

        {/* Hero Image */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Imagem Principal (Hero)
            </CardTitle>
            <CardDescription>
              Imagem exibida no topo da página inicial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {settings?.hero_image_url && (
                <div className="flex-shrink-0">
                  <img
                    src={settings.hero_image_url}
                    alt="Hero image preview"
                    className="w-full md:w-64 h-40 object-cover rounded-lg border border-border"
                  />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="hero-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {uploading ? 'Enviando...' : 'Clique para fazer upload de uma nova imagem'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG ou WEBP (recomendado: 1920x1080)
                      </p>
                    </div>
                    <Input
                      id="hero-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
