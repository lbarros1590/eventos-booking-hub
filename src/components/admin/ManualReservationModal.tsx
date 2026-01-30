import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp, Profile } from '@/contexts/AppContext';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, User, Plus, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface ManualReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSuccess: () => Promise<void>;
}

const ManualReservationModal = ({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
}: ManualReservationModalProps) => {
  const { profiles, createManualBooking, createManualClient } = useApp();
  const { calculatePriceForDate } = useVenueSettings();
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState<'pending' | 'confirmed'>('pending');
  const [depositPaid, setDepositPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Quick client creation
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const priceInfo = selectedDate ? calculatePriceForDate(selectedDate, false) : null;

  useEffect(() => {
    if (selectedDate && priceInfo) {
      setCustomPrice(priceInfo.total.toString());
    }
  }, [selectedDate, priceInfo]);

  const handleCreateQuickClient = async () => {
    if (!newClientName || !newClientPhone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    setLoading(true);
    const result = await createManualClient({
      name: newClientName,
      phone: newClientPhone,
      birth_date: null,
    });

    if (result.error) {
      toast.error('Erro ao criar cliente');
    } else if (result.profile) {
      toast.success('Cliente criado!');
      setSelectedClientId(result.profile.user_id);
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
    }
    setLoading(false);
  };

  const handleCreateReservation = async () => {
    if (!selectedDate || !selectedClientId) {
      toast.error('Selecione um cliente');
      return;
    }

    const price = parseFloat(customPrice) || priceInfo?.total || 0;
    
    setLoading(true);
    const result = await createManualBooking({
      user_id: selectedClientId,
      booking_date: selectedDate.toISOString().split('T')[0],
      price: priceInfo?.basePrice || price,
      cleaning_fee: priceInfo?.cleaningFee || 0,
      total_price: price,
      status: bookingStatus,
      deposit_paid: depositPaid,
      origin: 'admin_manual',
    });

    if (result.error) {
      toast.error('Erro ao criar reserva');
    } else {
      toast.success('Reserva criada com sucesso!');
      onOpenChange(false);
      await onSuccess();
      // Reset form
      setSelectedClientId('');
      setCustomPrice('');
      setBookingStatus('pending');
      setDepositPaid(false);
    }
    setLoading(false);
  };

  const finalPrice = parseFloat(customPrice) || priceInfo?.total || 0;
  const depositAmount = Math.round(finalPrice / 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Nova Reserva Manual
          </DialogTitle>
          <DialogDescription>
            {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Cliente
            </Label>

            {!showNewClient ? (
              <>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.name} {profile.phone && `- ${profile.phone}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewClient(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Novo Cliente
                </Button>
              </>
            ) : (
              <div className="p-4 border border-border rounded-lg space-y-3">
                <Input
                  placeholder="Nome do cliente"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  placeholder="Telefone"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewClient(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateQuickClient}
                    disabled={loading}
                    className="flex-1 bg-gradient-primary"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Preço Customizado
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="pl-10"
                placeholder={priceInfo?.total.toString()}
              />
            </div>
            {priceInfo && (
              <p className="text-xs text-muted-foreground">
                Preço sugerido: R$ {priceInfo.total} (Diária: R$ {priceInfo.basePrice} + Limpeza: R$ {priceInfo.cleaningFee})
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label>Status Inicial</Label>
            <Select value={bookingStatus} onValueChange={(v) => setBookingStatus(v as 'pending' | 'confirmed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente (Aguardando Depósito)</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deposit Paid */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <p className="font-medium">Sinal (50%)</p>
              <p className="text-sm text-muted-foreground">R$ {depositAmount}</p>
            </div>
            <Button
              type="button"
              variant={depositPaid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDepositPaid(!depositPaid)}
              className={depositPaid ? 'bg-success hover:bg-success/90' : ''}
            >
              {depositPaid ? 'Pago' : 'Marcar como Pago'}
            </Button>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">R$ {finalPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Depósito (50%)</span>
              <span className={depositPaid ? 'text-success' : ''}>
                R$ {depositAmount} {depositPaid && '✓'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Restante</span>
              <span>R$ {finalPrice - (depositPaid ? depositAmount : 0)}</span>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleCreateReservation}
            disabled={loading || !selectedClientId}
            className="w-full bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Reserva'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualReservationModal;
