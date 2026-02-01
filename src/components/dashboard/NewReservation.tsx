import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { getIcon } from '@/lib/icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Check, AlertCircle, Sparkles, Loader2, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOYALTY_THRESHOLD = 4;

const NewReservation = () => {
  const { profile, isDateBooked, createBooking } = useApp();
  const { settings, calendarExceptions, calculatePriceForDate, isDateBlocked, loading } = useVenueSettings();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [checklistConfirmed, setChecklistConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const priceInfo = selectedDate ? calculatePriceForDate(selectedDate, profile?.has_discount) : null;
  const galleryUrls = settings?.gallery_urls || [];

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      if (isDateBooked(date)) {
        toast.error('Esta data já está reservada. Escolha outra data.');
        return;
      }
      if (isDateBlocked(date)) {
        toast.error('Esta data está bloqueada. Escolha outra data.');
        return;
      }
    }
    setSelectedDate(date);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !priceInfo) return;

    setSubmitting(true);

    const { error } = await createBooking({
      booking_date: selectedDate.toISOString().split('T')[0],
      price: priceInfo.basePrice,
      cleaning_fee: priceInfo.cleaningFee,
      total_price: priceInfo.total,
      status: 'pending',
      checklist_confirmed: checklistConfirmed,
      terms_accepted: termsAccepted,
      deposit_paid: false,
      final_balance_paid: false,
      manual_price_override: null,
      waive_cleaning_fee: false,
      custom_checklist_items: null,
      discount_applied: profile?.has_discount ? Math.round((priceInfo.basePrice + priceInfo.cleaningFee) * 0.2) : 0,
      origin: 'web',
      payment_method: null,
    });

    if (error) {
      toast.error('Erro ao criar reserva. Tente novamente.');
    } else {
      toast.success('Reserva solicitada com sucesso! Aguarde a confirmação.');
      setSelectedDate(undefined);
      setChecklistConfirmed(false);
      setTermsAccepted(false);
    }

    setSubmitting(false);
  };

  const isFormValid = selectedDate && checklistConfirmed && termsAccepted;

  const isVideo = (url: string) => {
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const amenities = settings.amenities_list || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Nova Reserva
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecione a data desejada e confirme os itens do espaço
        </p>
      </div>

      {/* Gallery Preview */}
      {galleryUrls.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Image className="w-5 h-5 text-primary" />
              Galeria do Espaço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-xl overflow-hidden">
              {isVideo(galleryUrls[galleryIndex]) ? (
                <video
                  src={galleryUrls[galleryIndex]}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={galleryUrls[galleryIndex]}
                  alt={`Espaço ${galleryIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              
              {galleryUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex((prev) => (prev - 1 + galleryUrls.length) % galleryUrls.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setGalleryIndex((prev) => (prev + 1) % galleryUrls.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {galleryUrls.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGalleryIndex(idx)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          idx === galleryIndex ? "w-6 bg-white" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loyalty Badge */}
      {profile && profile.reservation_count >= LOYALTY_THRESHOLD && profile.has_discount && (
        <div className="flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-xl p-4">
          <Sparkles className="w-6 h-6 text-accent" />
          <div>
            <p className="font-semibold text-foreground">Desconto de Fidelidade Ativo!</p>
            <p className="text-sm text-muted-foreground">
              Você tem 20% de desconto nesta reserva
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              1. Escolha a Data
            </CardTitle>
            <CardDescription>
              Datas em vermelho estão indisponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || isDateBooked(date) || isDateBlocked(date);
              }}
              modifiers={{
                booked: (date) => isDateBooked(date),
                blocked: (date) => isDateBlocked(date),
              }}
              modifiersStyles={{
                booked: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
                blocked: { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', textDecoration: 'line-through' },
              }}
              className="rounded-md border w-full pointer-events-auto"
              locale={ptBR}
            />

            {selectedDate && priceInfo && (
              <div className="mt-4 p-4 bg-primary/5 rounded-xl space-y-2">
                <p className="font-medium text-foreground">
                  Data selecionada: {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diária:</span>
                    <span>R$ {priceInfo.basePrice},00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de limpeza:</span>
                    <span>R$ {priceInfo.cleaningFee},00</span>
                  </div>
                  {profile?.has_discount && (
                    <div className="flex justify-between text-accent">
                      <span>Desconto fidelidade (20%):</span>
                      <span>- R$ {Math.round((priceInfo.basePrice + priceInfo.cleaningFee) * 0.2)},00</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total:</span>
                    <span className="text-primary">R$ {priceInfo.total},00</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Sinal (50%):</span>
                    <span className="font-semibold text-accent">R$ {priceInfo.deposit},00</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className={cn(!selectedDate && 'opacity-50 pointer-events-none')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              2. Confira os Itens
            </CardTitle>
            <CardDescription>
              O espaço inclui os seguintes itens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {amenities.map((amenity) => {
                const Icon = getIcon(amenity.icon);
                return (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-2 p-2 bg-secondary rounded-lg"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{amenity.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="checklist"
                  checked={checklistConfirmed}
                  onCheckedChange={(checked) => setChecklistConfirmed(checked as boolean)}
                />
                <Label htmlFor="checklist" className="text-sm leading-relaxed cursor-pointer">
                  Confirmo que revisei todos os itens do espaço listados acima
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  Li e aceito os termos de uso do espaço. Me comprometo a devolver o espaço
                  nas mesmas condições em que o recebi.
                </Label>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Duração do evento: 12 horas</li>
                  <li>{settings?.payment_terms_text || '50% no ato da reserva, 50% na entrega das chaves.'}</li>
                  <li>Cancelamento gratuito até 7 dias antes</li>
                </ul>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary"
              size="lg"
              disabled={!isFormValid || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Processando...' : 'Solicitar Reserva'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewReservation;
