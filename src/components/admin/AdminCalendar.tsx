import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useApp, Booking } from '@/contexts/AppContext';
import { useVenueSettings, CalendarException } from '@/hooks/useVenueSettings';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Phone, User, DollarSign, XCircle, CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminCalendar = () => {
  const { bookings, profiles, updateBookingStatus, refreshData } = useApp();
  const { calendarExceptions, addCalendarException, updateCalendarException, deleteCalendarException, refreshExceptions } = useVenueSettings();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Exception form state
  const [exceptionDate, setExceptionDate] = useState<Date | undefined>();
  const [exceptionPrice, setExceptionPrice] = useState('');
  const [exceptionBlocked, setExceptionBlocked] = useState(false);
  const [exceptionNote, setExceptionNote] = useState('');
  const [savingException, setSavingException] = useState(false);

  const bookedDates = bookings
    .filter((b) => b.status !== 'cancelled')
    .map((b) => parseISO(b.booking_date));

  const blockedDates = calendarExceptions
    .filter(e => e.is_blocked)
    .map(e => parseISO(e.exception_date));

  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    
    const booking = bookings.find(
      (b) => b.booking_date === date.toISOString().split('T')[0] && b.status !== 'cancelled'
    );

    if (booking) {
      setSelectedBooking(booking);
      setBookingModalOpen(true);
    }
  };

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.name || 'Cliente';
  };

  const getUserPhone = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.phone || 'Não informado';
  };

  const handleStatusChange = async (newStatus: Booking['status']) => {
    if (!selectedBooking) return;
    setUpdating(true);
    
    await updateBookingStatus(selectedBooking.id, newStatus);
    toast.success(`Status atualizado para ${getStatusLabel(newStatus)}`);
    
    setUpdating(false);
    setBookingModalOpen(false);
    await refreshData();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pendente</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Confirmada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Cancelada</Badge>;
      default:
        return null;
    }
  };

  const handleAddException = () => {
    setExceptionDate(selectedDate);
    setExceptionPrice('');
    setExceptionBlocked(false);
    setExceptionNote('');
    setExceptionModalOpen(true);
  };

  const handleSaveException = async () => {
    if (!exceptionDate) return;
    setSavingException(true);

    const dateStr = exceptionDate.toISOString().split('T')[0];
    const existingException = calendarExceptions.find(e => e.exception_date === dateStr);

    const exceptionData = {
      exception_date: dateStr,
      custom_price: exceptionPrice ? parseFloat(exceptionPrice) : null,
      is_blocked: exceptionBlocked,
      note: exceptionNote || null,
    };

    let result;
    if (existingException) {
      result = await updateCalendarException(existingException.id, exceptionData);
    } else {
      result = await addCalendarException(exceptionData);
    }

    if (result.error) {
      toast.error('Erro ao salvar exceção');
    } else {
      toast.success('Exceção salva com sucesso!');
      setExceptionModalOpen(false);
      await refreshExceptions();
    }

    setSavingException(false);
  };

  const handleDeleteException = async (id: string) => {
    const result = await deleteCalendarException(id);
    if (result.error) {
      toast.error('Erro ao remover exceção');
    } else {
      toast.success('Exceção removida');
      await refreshExceptions();
    }
  };

  const getExceptionForDate = (date: Date): CalendarException | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarExceptions.find(e => e.exception_date === dateStr);
  };

  const currentException = selectedDate ? getExceptionForDate(selectedDate) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Calendário
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie reservas e datas especiais
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
            <CardDescription>Clique em uma data reservada para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateClick}
              modifiers={{
                booked: bookedDates,
                blocked: blockedDates,
              }}
              modifiersStyles={{
                booked: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'white',
                  fontWeight: 'bold',
                },
                blocked: {
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  textDecoration: 'line-through',
                },
              }}
              className="rounded-md border w-full pointer-events-auto"
              locale={ptBR}
            />

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span className="text-muted-foreground">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted" />
                <span className="text-muted-foreground">Bloqueado</span>
              </div>
            </div>
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
          <CardContent className="space-y-4">
            {currentException && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Especial</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteException(currentException.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                {currentException.is_blocked && (
                  <Badge variant="outline" className="bg-muted-foreground/10">Bloqueado</Badge>
                )}
                {currentException.custom_price && (
                  <p className="text-sm">Preço: R$ {currentException.custom_price}</p>
                )}
                {currentException.note && (
                  <p className="text-sm text-muted-foreground">{currentException.note}</p>
                )}
              </div>
            )}

            <Button
              onClick={handleAddException}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {currentException ? 'Editar Exceção' : 'Adicionar Exceção'}
            </Button>

            {selectedDate && !bookings.find(b => b.booking_date === selectedDate.toISOString().split('T')[0] && b.status !== 'cancelled') && (
              <div className="text-center py-4">
                <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Data disponível</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhuma reserva para este dia
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exceptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Datas Especiais</CardTitle>
          <CardDescription>Feriados, manutenção e preços especiais</CardDescription>
        </CardHeader>
        <CardContent>
          {calendarExceptions.length > 0 ? (
            <div className="space-y-2">
              {calendarExceptions.map(exception => (
                <div key={exception.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="font-medium">
                        {format(parseISO(exception.exception_date), 'dd/MM/yyyy')}
                      </span>
                      {exception.note && (
                        <span className="text-muted-foreground ml-2">- {exception.note}</span>
                      )}
                    </div>
                    {exception.is_blocked && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        Bloqueado
                      </Badge>
                    )}
                    {exception.custom_price && (
                      <Badge variant="outline">R$ {exception.custom_price}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteException(exception.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma data especial cadastrada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
            <DialogDescription>
              {selectedBooking && format(parseISO(selectedBooking.booking_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status atual</span>
                {getStatusBadge(selectedBooking.status)}
              </div>

              {/* Client Info */}
              <div className="p-4 bg-secondary rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-semibold text-foreground">{getUserName(selectedBooking.user_id)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-semibold text-foreground">{getUserPhone(selectedBooking.user_id)}</p>
                  </div>
                </div>
              </div>

              {/* Financial */}
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

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('confirmed')}
                      disabled={updating}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Confirmar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Cancelar
                    </Button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <>
                    <Button
                      onClick={() => handleStatusChange('completed')}
                      disabled={updating}
                      className="bg-success hover:bg-success/90"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Concluir
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Cancelar
                    </Button>
                  </>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Reserva criada em {format(parseISO(selectedBooking.created_at), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exception Modal */}
      <Dialog open={exceptionModalOpen} onOpenChange={setExceptionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Exceção</DialogTitle>
            <DialogDescription>
              {exceptionDate && format(exceptionDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customPrice">Preço Customizado (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="customPrice"
                  type="number"
                  value={exceptionPrice}
                  onChange={(e) => setExceptionPrice(e.target.value)}
                  placeholder="Deixe vazio para usar preço padrão"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="blocked">Bloquear data</Label>
                <p className="text-xs text-muted-foreground">Impede novas reservas</p>
              </div>
              <Switch
                id="blocked"
                checked={exceptionBlocked}
                onCheckedChange={setExceptionBlocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Observação (opcional)</Label>
              <Input
                id="note"
                value={exceptionNote}
                onChange={(e) => setExceptionNote(e.target.value)}
                placeholder="Ex: Natal, Manutenção..."
              />
            </div>

            <Button
              onClick={handleSaveException}
              disabled={savingException}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {savingException ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Exceção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;
