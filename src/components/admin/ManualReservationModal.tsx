import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useApp, Profile } from '@/contexts/AppContext';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, User, Plus, Calendar, DollarSign, Check, X } from 'lucide-react';
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
  const { profiles, createManualBooking, createManualClient, refreshData } = useApp();
  const { calculatePriceForDate } = useVenueSettings();
  
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [depositReceived, setDepositReceived] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Quick client creation
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBirthDate, setNewClientBirthDate] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const priceInfo = selectedDate ? calculatePriceForDate(selectedDate, false) : null;

  useEffect(() => {
    if (selectedDate && priceInfo) {
      setCustomPrice(priceInfo.total.toString());
    }
  }, [selectedDate, priceInfo]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedProfileId('');
      setCustomPrice('');
      setDepositReceived(false);
      setPaymentMethod('');
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientBirthDate('');
      setNewClientEmail('');
    }
  }, [open]);

  const handleCreateQuickClient = async () => {
    if (!newClientName || !newClientPhone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    // Check if phone already exists
    const phoneExists = profiles.some(p => p.phone === newClientPhone);
    if (phoneExists) {
      toast.error('Já existe um cliente com este telefone');
      return;
    }

    setLoading(true);
    const result = await createManualClient({
      name: newClientName,
      phone: newClientPhone,
      birth_date: newClientBirthDate || null,
      email: newClientEmail || null,
    });

    if (result.error) {
      toast.error('Erro ao criar cliente');
    } else if (result.profile) {
      toast.success('Cliente criado!');
      await refreshData();
      setSelectedProfileId(result.profile.id);
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientBirthDate('');
      setNewClientEmail('');
    }
    setLoading(false);
  };

  const handleCreateReservation = async () => {
    if (!selectedDate || !selectedProfileId) {
      toast.error('Selecione um cliente');
      return;
    }

    const price = parseFloat(customPrice) || priceInfo?.total || 0;
    
    // Status is determined by deposit payment
    const status = depositReceived ? 'confirmed' : 'pending';
    
    setLoading(true);
    const result = await createManualBooking({
      profile_id: selectedProfileId,
      booking_date: selectedDate.toISOString().split('T')[0],
      price: priceInfo?.basePrice || price,
      cleaning_fee: priceInfo?.cleaningFee || 0,
      total_price: price,
      status,
      deposit_paid: depositReceived,
      payment_method: paymentMethod || null,
      origin: 'admin_manual',
    });

    if (result.error) {
      toast.error('Erro ao criar reserva');
    } else {
      toast.success('Reserva criada com sucesso!');
      onOpenChange(false);
      await onSuccess();
    }
    setLoading(false);
  };

  const finalPrice = parseFloat(customPrice) || priceInfo?.total || 0;
  const depositAmount = Math.round(finalPrice / 2);

  // Sort profiles alphabetically
  const sortedProfiles = [...profiles].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center gap-2">
                          <span>{profile.name}</span>
                          {profile.phone && (
                            <span className="text-muted-foreground text-xs">- {profile.phone}</span>
                          )}
                          {profile.user_id === null && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">Manual</span>
                          )}
                        </div>
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
              <div className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30">
                <Input
                  placeholder="Nome do cliente *"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  placeholder="Telefone *"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email (opcional)"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="Data de Nascimento"
                  value={newClientBirthDate}
                  onChange={(e) => setNewClientBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewClient(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateQuickClient}
                    disabled={loading}
                    className="flex-1 bg-gradient-primary"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Criar
                      </>
                    )}
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

          {/* Deposit Toggle */}
          <div className="p-4 bg-secondary rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sinal de 50% Recebido?</p>
                <p className="text-sm text-muted-foreground">R$ {depositAmount}</p>
              </div>
              <Switch
                checked={depositReceived}
                onCheckedChange={setDepositReceived}
              />
            </div>

            {depositReceived && (
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status da reserva:</span>
                {depositReceived ? (
                  <span className="font-medium text-success">Confirmada</span>
                ) : (
                  <span className="font-medium text-warning">Pendente</span>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">R$ {finalPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Depósito (50%)</span>
              <span className={depositReceived ? 'text-success' : ''}>
                R$ {depositAmount} {depositReceived && '✓'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Restante</span>
              <span>R$ {finalPrice - (depositReceived ? depositAmount : 0)}</span>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleCreateReservation}
            disabled={loading || !selectedProfileId}
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
