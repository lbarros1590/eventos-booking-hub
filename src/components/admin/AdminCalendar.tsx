import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Phone } from 'lucide-react';

const AdminCalendar = () => {
  const { bookings, profiles } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const bookedDates = bookings
    .filter((b) => b.status !== 'cancelled')
    .map((b) => parseISO(b.booking_date));

  const selectedBooking = selectedDate
    ? bookings.find(
        (b) => b.booking_date === selectedDate.toISOString().split('T')[0] && b.status !== 'cancelled'
      )
    : null;

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.name || 'Cliente';
  };

  const getUserPhone = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.phone || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pendente</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Confirmada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Concluída</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Calendário
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize todas as reservas agendadas
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
            <CardDescription>Clique em uma data para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                booked: bookedDates,
              }}
              modifiersStyles={{
                booked: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'white',
                  fontWeight: 'bold',
                },
              }}
              className="rounded-md border w-full pointer-events-auto"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Detalhes
            </CardTitle>
            <CardDescription>
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'Selecione uma data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBooking ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>

                <div className="p-4 bg-secondary rounded-xl space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-semibold text-foreground">{getUserName(selectedBooking.user_id)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{getUserPhone(selectedBooking.user_id)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diária</span>
                    <span>R$ {Number(selectedBooking.price).toFixed(0)},00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de limpeza</span>
                    <span>R$ {Number(selectedBooking.cleaning_fee).toFixed(0)},00</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">R$ {Number(selectedBooking.total_price).toFixed(0)},00</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Reserva criada em {format(parseISO(selectedBooking.created_at), 'dd/MM/yyyy')}
                </div>
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Data disponível</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhuma reserva para este dia
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Selecione uma data no calendário</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCalendar;
