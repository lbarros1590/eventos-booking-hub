import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { useApp } from '@/contexts/AppContext';
import { format, isBefore, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookedDate {
  booking_date: string;
  status: string;
}

const AvailabilityCalendar = () => {
  const navigate = useNavigate();
  const { user, profile } = useApp();
  const { settings, calendarExceptions, calculatePriceForDate, isDateBlocked, loading: settingsLoading } = useVenueSettings();
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookedDates = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, status')
        .neq('status', 'cancelled');

      if (!error && data) {
        setBookedDates(data);
      }
      setLoading(false);
    };

    fetchBookedDates();
  }, []);

  const isDateBooked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return bookedDates.some(b => b.booking_date === dateStr);
  };

  const isPastDate = (date: Date): boolean => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (isPastDate(date) || isDateBooked(date) || isDateBlocked(date)) {
      return;
    }

    setSelectedDate(date);

    if (!user) {
      setShowLoginDialog(true);
    } else {
      navigate('/dashboard/reservas/nova');
    }
  };

  const priceInfo = selectedDate && settings 
    ? calculatePriceForDate(selectedDate, profile?.has_discount) 
    : null;

  const getDayClassName = (date: Date): string => {
    if (isPastDate(date)) return 'text-muted-foreground/40 cursor-not-allowed';
    if (isDateBooked(date)) return 'bg-destructive text-destructive-foreground cursor-not-allowed';
    if (isDateBlocked(date)) return 'bg-muted text-muted-foreground cursor-not-allowed line-through';
    return 'bg-success/10 text-success hover:bg-success/20 cursor-pointer';
  };

  if (loading || settingsLoading) {
    return (
      <section id="availability" className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Carregando calendário...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="availability" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Disponibilidade
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Confira as datas disponíveis
          </h2>
          <p className="text-muted-foreground text-lg">
            Clique em uma data verde para reservar. Não é necessário cadastro para verificar disponibilidade.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Calendário de Reservas
              </CardTitle>
              <CardDescription>
                Selecione uma data disponível para fazer sua reserva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Calendar */}
                <div className="flex-1">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => isPastDate(date)}
                    modifiers={{
                      booked: (date) => isDateBooked(date),
                      blocked: (date) => isDateBlocked(date),
                      available: (date) => !isPastDate(date) && !isDateBooked(date) && !isDateBlocked(date),
                    }}
                    modifiersStyles={{
                      booked: { 
                        backgroundColor: 'hsl(var(--destructive))', 
                        color: 'hsl(var(--destructive-foreground))',
                        cursor: 'not-allowed',
                      },
                      blocked: { 
                        backgroundColor: 'hsl(var(--muted))', 
                        color: 'hsl(var(--muted-foreground))',
                        textDecoration: 'line-through',
                        cursor: 'not-allowed',
                      },
                      available: { 
                        backgroundColor: 'hsl(142 76% 36% / 0.1)', 
                        color: 'hsl(142 76% 36%)',
                      },
                    }}
                    className="rounded-md border w-full pointer-events-auto"
                    locale={ptBR}
                  />
                </div>

                {/* Legend and Info */}
                <div className="lg:w-64 space-y-6">
                  {/* Legend */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Legenda</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-success/20 border border-success" />
                        <span className="text-sm text-muted-foreground">Disponível</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-destructive" />
                        <span className="text-sm text-muted-foreground">Reservado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-muted" />
                        <span className="text-sm text-muted-foreground">Bloqueado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-muted/50" />
                        <span className="text-sm text-muted-foreground">Passado</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  {settings && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Valores</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seg-Qui:</span>
                          <span className="font-medium">R$ {settings.base_price_weekday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sex-Dom:</span>
                          <span className="font-medium">R$ {settings.base_price_weekend}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Limpeza:</span>
                          <span className="font-medium">R$ {settings.cleaning_fee}</span>
                        </div>
                        {settings.global_discount_percent > 0 && (
                          <div className="flex justify-between text-accent">
                            <span>Promoção:</span>
                            <span className="font-medium">-{settings.global_discount_percent}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faça login para reservar</DialogTitle>
            <DialogDescription>
              Você precisa estar logado para fazer uma reserva.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDate && priceInfo && (
            <div className="p-4 bg-secondary rounded-xl space-y-2 my-4">
              <p className="font-medium text-foreground">
                Data selecionada: {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diária:</span>
                  <span>R$ {priceInfo.basePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limpeza:</span>
                  <span>R$ {priceInfo.cleaningFee}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-border">
                  <span>Total:</span>
                  <span className="text-primary">R$ {priceInfo.total}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/login')}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              Fazer Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/register')}
            >
              Criar Conta Grátis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AvailabilityCalendar;
