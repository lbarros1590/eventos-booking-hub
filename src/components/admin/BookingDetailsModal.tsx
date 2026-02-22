import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Profile } from '@/contexts/AuthContext';
import { Booking } from '@/contexts/DataContext';
import { ChecklistItem, useVenueSettings } from '@/hooks/useVenueSettings';
import { useInventory } from '@/hooks/useInventory';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User, Phone, DollarSign, CheckCircle, XCircle, Loader2,
  Printer, Plus, Trash2, Edit2, Receipt
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  profile: Profile | null;
  onStatusChange: (status: Booking['status']) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const BookingDetailsModal = ({
  open,
  onOpenChange,
  booking,
  profile,
  onStatusChange,
  onRefresh,
}: BookingDetailsModalProps) => {
  const { settings } = useVenueSettings();
  const { items: inventoryItems } = useInventory();
  const [updating, setUpdating] = useState(false);
  const [depositPaid, setDepositPaid] = useState(false);
  const [finalBalancePaid, setFinalBalancePaid] = useState(false);
  const [manualPriceOverride, setManualPriceOverride] = useState<string>('');
  const [waiveCleaningFee, setWaiveCleaningFee] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (booking && settings) {
      setDepositPaid((booking as any).deposit_paid || false);
      setFinalBalancePaid((booking as any).final_balance_paid || false);
      setManualPriceOverride((booking as any).manual_price_override?.toString() || '');
      setWaiveCleaningFee((booking as any).waive_cleaning_fee || false);

      // Load checklist items
      const customItems = (booking as any).custom_checklist_items as ChecklistItem[] | null;
      if (customItems && customItems.length > 0) {
        setChecklistItems(customItems);
      } else if (settings.default_checklist_items) {
        setChecklistItems(settings.default_checklist_items);
      }
    }
  }, [booking, settings]);

  if (!booking) return null;

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

  const calculateFinalPrice = () => {
    if (manualPriceOverride && !isNaN(parseFloat(manualPriceOverride))) {
      return parseFloat(manualPriceOverride);
    }

    let price = Number(booking.price);
    let cleaning = waiveCleaningFee ? 0 : Number(booking.cleaning_fee);
    return price + cleaning;
  };

  const finalPrice = calculateFinalPrice();
  const depositAmount = Math.round(finalPrice / 2);
  const remainingBalance = finalPrice - (depositPaid ? depositAmount : 0);

  const handleSaveBookingDetails = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          deposit_paid: depositPaid,
          final_balance_paid: finalBalancePaid,
          manual_price_override: manualPriceOverride ? parseFloat(manualPriceOverride) : null,
          waive_cleaning_fee: waiveCleaningFee,
          custom_checklist_items: checklistItems as unknown as any,
          total_price: finalPrice,
        })
        .eq('id', booking.id);

      if (error) throw error;
      toast.success('Detalhes da reserva atualizados!');
      await onRefresh();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Erro ao atualizar reserva');
    }
    setSaving(false);
  };

  const handleStatusChange = async (status: Booking['status']) => {
    setUpdating(true);
    await onStatusChange(status);
    setUpdating(false);
    onOpenChange(false);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now(),
      item: newChecklistItem.trim(),
      checked: false,
    };
    setChecklistItems([...checklistItems, newItem]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: number) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  const handlePrint = async () => {
    // Fetch current inventory items for the checklist
    const { data: currentInventory } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    const inventoryChecklist = (currentInventory || []).map(item => ({
      name: item.quantity > 1 ? `${item.name} (${item.quantity} unidades)` : item.name,
      category: item.category as string,
    }));

    // Group by category for organized printing
    const groupedInventory = inventoryChecklist.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item.name);
      return acc;
    }, {} as Record<string, string[]>);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Contrato EJ Eventos</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #0ea5e9;
          }
          .header h1 { color: #0ea5e9; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .section { margin-bottom: 25px; }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #0ea5e9; 
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item label { font-weight: bold; color: #666; font-size: 12px; display: block; }
          .info-item span { font-size: 15px; }
          .financial-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .financial-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
          .financial-table .label { color: #666; }
          .financial-table .value { text-align: right; font-weight: 500; }
          .financial-table .total { font-weight: bold; font-size: 18px; color: #0ea5e9; border-top: 2px solid #0ea5e9; }
          .checklist { list-style: none; }
          .checklist li { 
            padding: 10px 0; 
            border-bottom: 1px solid #eee; 
            display: flex; 
            align-items: center; 
            gap: 10px;
          }
          .checkbox { 
            width: 18px; 
            height: 18px; 
            border: 2px solid #0ea5e9; 
            border-radius: 3px;
          }
          .signatures { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 50px; 
            margin-top: 60px;
            padding-top: 20px;
          }
          .signature-line { 
            text-align: center; 
            padding-top: 60px; 
            border-top: 1px solid #333;
          }
          .signature-line span { display: block; font-size: 12px; color: #666; margin-top: 5px; }
          .payment-status { 
            display: inline-block; 
            padding: 4px 10px; 
            border-radius: 12px; 
            font-size: 12px;
            font-weight: bold;
          }
          .paid { background: #dcfce7; color: #16a34a; }
          .pending { background: #fef3c7; color: #d97706; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EJ Eventos</h1>
          <p>Contrato de Locação de Espaço</p>
        </div>

        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Nome</label>
              <span>${profile?.name || 'Não informado'}</span>
            </div>
            <div class="info-item">
              <label>Telefone</label>
              <span>${profile?.phone || 'Não informado'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Dados da Reserva</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Data do Evento</label>
              <span>${format(parseISO(booking.booking_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div class="info-item">
              <label>Duração</label>
              <span>12 horas</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Resumo Financeiro</div>
          <table class="financial-table">
            <tr>
              <td class="label">Diária</td>
              <td class="value">R$ ${Number(booking.price).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Taxa de Limpeza</td>
              <td class="value">${waiveCleaningFee ? 'Isento' : `R$ ${Number(booking.cleaning_fee).toFixed(2)}`}</td>
            </tr>
            ${manualPriceOverride ? `
            <tr>
              <td class="label">Ajuste de Preço</td>
              <td class="value">R$ ${parseFloat(manualPriceOverride).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr class="total">
              <td>Total</td>
              <td class="value">R$ ${finalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Sinal (50%)</td>
              <td class="value">
                R$ ${depositAmount.toFixed(2)}
                <span class="payment-status ${depositPaid ? 'paid' : 'pending'}">${depositPaid ? 'PAGO' : 'PENDENTE'}</span>
              </td>
            </tr>
            <tr>
              <td class="label">Restante</td>
              <td class="value">
                R$ ${remainingBalance.toFixed(2)}
                <span class="payment-status ${finalBalancePaid ? 'paid' : 'pending'}">${finalBalancePaid ? 'PAGO' : 'PENDENTE'}</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Checklist de Entrega - Inventário do Espaço</div>
          ${Object.entries(groupedInventory).map(([category, items]) => `
            <div style="margin-bottom: 15px;">
              <p style="font-weight: bold; color: #0ea5e9; font-size: 13px; margin-bottom: 8px;">${category}</p>
              <ul class="checklist">
                ${(items as string[]).map(item => `
                  <li>
                    <div class="checkbox"></div>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
          
          ${checklistItems.length > 0 ? `
            <div style="margin-top: 20px;">
              <p style="font-weight: bold; color: #666; font-size: 13px; margin-bottom: 8px;">Itens Adicionais</p>
              <ul class="checklist">
                ${checklistItems.map(item => `
                  <li>
                    <div class="checkbox"></div>
                    <span>${item.item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Termos</div>
          <p style="font-size: 13px; color: #666;">
            ${settings?.payment_terms_text || '50% no ato da reserva, 50% na entrega das chaves.'}
          </p>
          <p style="font-size: 13px; color: #666; margin-top: 10px;">
            O locatário compromete-se a devolver o espaço nas mesmas condições em que o recebeu.
          </p>
        </div>

        <div class="signatures">
          <div class="signature-line">
            <strong>Locador</strong>
            <span>EJ Eventos</span>
          </div>
          <div class="signature-line">
            <strong>Locatário</strong>
            <span>${profile?.name || ''}</span>
          </div>
        </div>

        <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
          Data de impressão: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
        </p>

        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Reserva</DialogTitle>
          <DialogDescription>
            {format(parseISO(booking.booking_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status atual</span>
            {getStatusBadge(booking.status)}
          </div>

          {/* Client Info */}
          <div className="p-4 bg-secondary rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-semibold text-foreground">{profile?.name || 'Cliente'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-semibold text-foreground">{profile?.phone || 'Não informado'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Financeiro
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diária</span>
                <span>R$ {Number(booking.price).toFixed(0)},00</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Taxa de limpeza</span>
                  <Switch
                    checked={waiveCleaningFee}
                    onCheckedChange={setWaiveCleaningFee}
                    className="scale-75"
                  />
                  {waiveCleaningFee && <span className="text-xs text-accent">(Isento)</span>}
                </div>
                <span className={waiveCleaningFee ? 'line-through text-muted-foreground' : ''}>
                  R$ {Number(booking.cleaning_fee).toFixed(0)},00
                </span>
              </div>

              {/* Show discount applied if any */}
              {booking.discount_applied && Number(booking.discount_applied) > 0 && (
                <div className="flex justify-between text-sm text-accent">
                  <span className="flex items-center gap-1">
                    🎁 Desconto Fidelidade
                  </span>
                  <span>- R$ {Number(booking.discount_applied).toFixed(0)},00</span>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="override" className="text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Sobrescrever Preço Final
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="override"
                    type="number"
                    value={manualPriceOverride}
                    onChange={(e) => setManualPriceOverride(e.target.value)}
                    placeholder="Deixe vazio para calcular automaticamente"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-between font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">R$ {finalPrice.toFixed(0)},00</span>
              </div>
            </div>

            {/* Payment Toggles */}
            <div className="p-4 bg-muted rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sinal (50%)</p>
                  <p className="text-sm text-muted-foreground">R$ {depositAmount},00</p>
                </div>
                <Switch
                  checked={depositPaid}
                  onCheckedChange={setDepositPaid}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Saldo Final (Entrega)</p>
                  <p className="text-sm text-muted-foreground">R$ {remainingBalance},00</p>
                </div>
                <Switch
                  checked={finalBalancePaid}
                  onCheckedChange={setFinalBalancePaid}
                  disabled={!depositPaid}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Checklist Section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Checklist de Entrega
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                  <span className="text-sm">{item.item}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChecklistItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Adicionar item..."
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
              />
              <Button variant="outline" onClick={addChecklistItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Save & Print */}
          <div className="flex gap-3">
            <Button
              onClick={handleSaveBookingDetails}
              disabled={saving}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Contrato
            </Button>
          </div>

          {/* Status Actions */}
          <div className="grid grid-cols-2 gap-3">
            {booking.status === 'pending' && (
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
            {booking.status === 'confirmed' && (
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
            Reserva criada em {format(parseISO(booking.created_at), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;
