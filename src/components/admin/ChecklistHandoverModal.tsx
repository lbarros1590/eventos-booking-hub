import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Profile } from '@/contexts/AuthContext';
import { Booking } from '@/contexts/DataContext';
import { useInventory, InventoryItem } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp,
    Phone, Mail, MessageSquare, Printer, Loader2, ClipboardCheck,
    Plus, Trash2, DollarSign
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChecklistItemStatus = 'ok' | 'observation' | 'problem';

export interface ChecklistEntry {
    id: string;
    item: string;
    category: string;
    status: ChecklistItemStatus;
    observation: string;
}

interface ChecklistHandoverModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: Booking | null;
    profile: Profile | null;
    onRefresh: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const OWNER_PHONE = '5565992286607'; // Number registered: (65) 99228-6607 — EJ Eventos

function buildInventoryEntries(inventoryItems: InventoryItem[]): ChecklistEntry[] {
    return inventoryItems
        .filter(i => i.is_active)
        .map(i => ({
            id: i.id,
            item: i.quantity > 1 ? `${i.name} (${i.quantity} unidades)` : i.name,
            category: i.category,
            status: 'ok' as ChecklistItemStatus,
            observation: '',
        }));
}

function groupByCategory(entries: ChecklistEntry[]): Record<string, ChecklistEntry[]> {
    return entries.reduce((acc, e) => {
        if (!acc[e.category]) acc[e.category] = [];
        acc[e.category].push(e);
        return acc;
    }, {} as Record<string, ChecklistEntry[]>);
}

function statusIcon(status: ChecklistItemStatus) {
    switch (status) {
        case 'ok':
            return <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />;
        case 'observation':
            return <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />;
        case 'problem':
            return <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />;
    }
}

function statusLabel(status: ChecklistItemStatus) {
    switch (status) {
        case 'ok': return 'OK';
        case 'observation': return 'Observação';
        case 'problem': return 'Problema';
    }
}

// ─── Contract HTML generator (reuses logic from BookingDetailsModal) ──────────

function generateContractHTML(
    booking: Booking,
    profile: Profile | null,
    fullProfile: Record<string, any>,
    entries: ChecklistEntry[],
    depositAmount: number,
    remainingBalance: number,
    depositPaid: boolean,
    finalBalancePaid: boolean,
): string {
    const grouped = groupByCategory(entries);
    const issueItems = entries.filter(e => e.status !== 'ok');

    return `<!DOCTYPE html>
<html>
<head>
  <title>Contrato de Locação de Espaço - EJ Eventos</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; font-size: 14px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0ea5e9; }
    .header h1 { color: #0ea5e9; font-size: 28px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: bold; color: #0ea5e9; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
    .financial-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .financial-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .financial-table .label { color: #666; }
    .financial-table .value { text-align: right; font-weight: 500; }
    .financial-table .total { font-weight: bold; font-size: 18px; color: #0ea5e9; border-top: 2px solid #0ea5e9; }
    .checklist-item { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; gap: 10px; }
    .status-badge-ok { background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; white-space: nowrap; }
    .status-badge-obs { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; white-space: nowrap; }
    .status-badge-prob { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; white-space: nowrap; }
    .observation-text { font-size: 12px; color: #666; font-style: italic; margin-top: 2px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 60px; padding-top: 20px; }
    .signature-line { text-align: center; padding-top: 60px; border-top: 1px solid #333; }
    .signature-line span { display: block; font-size: 12px; color: #666; margin-top: 5px; }
    .text-justify { text-align: justify; }
    .mb-10 { margin-bottom: 10px; }
    .mt-20 { margin-top: 20px; }
    .page-break { page-break-before: always; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>EJ Eventos</h1>
    <p>Contrato de Locação de Espaço para Eventos</p>
  </div>

  <div class="section">
    <div class="section-title">1. PARTES CONTRATANTES</div>
    <p class="mb-10">
      Pelo presente instrumento particular, de um lado, como <strong>LOCADORA</strong>:
      <strong>LEINER PAULA CHICATI</strong>, brasileira, casada, CPF nº 027.926.611-19,
      residente na Rua Fernando Bassan, casa 274, Condomínio Hawaii, Pascoal Ramos, Cuiabá – MT,
      proprietária do espaço <strong>EJ EVENTOS</strong>, situado na R. dos Cravos, 174 – Serra Dourada, Cuiabá – MT, CEP 78056-239.
    </p>
    <p>
      E de outro lado, como <strong>LOCATÁRIA</strong>:
      <strong>${profile?.name?.toUpperCase() || 'NOME DO CLIENTE'}</strong>,
      ${profile?.phone ? `telefone ${profile.phone},` : ''}
      CPF nº ${fullProfile?.cpf || '___________________'},
      ${fullProfile?.rg ? `RG nº ${fullProfile.rg},` : ''}
      residente e domiciliado(a) em ${fullProfile?.address || '_______________________________________________'}.
    </p>
  </div>

  <div class="section">
    <div class="section-title">2. OBJETO E DATA</div>
    <p class="text-justify">
      Locação temporária do espaço <strong>EJ EVENTOS</strong> para fins de evento social no dia
      <strong>${format(parseISO(booking.booking_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>,
      com duração de 12 (doze) horas, com início às 20:00h e término às 08:00h do dia seguinte.
    </p>
  </div>

  <div class="section">
    <div class="section-title">3. VALORES E PAGAMENTOS</div>
    <table class="financial-table">
      <tr>
        <td class="label">Valor da Locação</td>
        <td class="value">R$ ${Number(booking.price).toFixed(0)},00</td>
      </tr>
      ${!booking.waive_cleaning_fee ? `<tr><td class="label">Taxa de Limpeza</td><td class="value">R$ ${Number(booking.cleaning_fee).toFixed(0)},00</td></tr>` : ''}
      ${booking.discount_applied > 0 ? `<tr><td class="label">Desconto</td><td class="value">– R$ ${Number(booking.discount_applied).toFixed(0)},00</td></tr>` : ''}
      <tr class="total">
        <td class="label">Total</td>
        <td class="value">R$ ${Number(booking.total_price).toFixed(0)},00</td>
      </tr>
      <tr>
        <td class="label">Sinal (50%) — ${depositPaid ? 'PAGO' : 'A PAGAR'}</td>
        <td class="value">R$ ${depositAmount},00</td>
      </tr>
      <tr>
        <td class="label">Saldo Final — ${finalBalancePaid ? 'PAGO' : 'A PAGAR'}</td>
        <td class="value">R$ ${remainingBalance},00</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">4. CLÁUSULAS E CONDIÇÕES</div>
    <p class="text-justify mb-10">
      4.1. É expressamente proibido o uso de som automotivo (apontado para dentro ou para fora do espaço).
      Após as 22:00h, o volume deverá ser reduzido, respeitando o silêncio dos vizinhos.
    </p>
    <p class="text-justify mb-10">
      4.2. LIMPEZA: O espaço deverá ser entregue limpo e organizado. Caso isso não ocorra, a taxa de limpeza
      ${booking.waive_cleaning_fee ? '(isenta nesta reserva)' : `de R$ ${Number(booking.cleaning_fee).toFixed(0)},00 será cobrada.`}
    </p>
    <p class="text-justify mb-10">
      4.3. DANOS: O LOCATÁRIO(A) responderá por qualquer dano causado ao espaço ou ao inventário, arcando
      integralmente com o custo de reparo ou substituição.
    </p>
    <p class="text-justify">
      4.4. Em caso de cancelamento com até 30 dias de antecedência, o sinal será devolvido integralmente.
      Cancelamentos com menos de 30 dias implicam perda de 50% do sinal.
    </p>
  </div>

  <div class="page-break"></div>

  <div class="section">
    <div class="section-title">5. CHECKLIST DE ENTREGA — INVENTÁRIO DO ESPAÇO</div>
    <p class="mb-10">
      Vistoria realizada em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} na presença de ambas as partes.
      Itens marcados com "Observação" ou "Problema" estão descritos abaixo.
    </p>
    ${Object.entries(grouped).map(([category, items]) => `
      <div style="margin-bottom: 15px;">
        <p style="font-weight: bold; color: #0ea5e9; font-size: 13px; margin-bottom: 6px;">${category}</p>
        ${items.map(e => `
          <div class="checklist-item">
            <span class="status-badge-${e.status === 'ok' ? 'ok' : e.status === 'observation' ? 'obs' : 'prob'}">
              ${e.status === 'ok' ? '✓ OK' : e.status === 'observation' ? '⚠ Obs.' : '✗ Prob.'}
            </span>
            <div>
              <span>${e.item}</span>
              ${e.observation ? `<div class="observation-text">» ${e.observation}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `).join('')}
    ${issueItems.length > 0 ? `
      <div style="margin-top:20px; padding:12px; background:#fff7ed; border-left:4px solid #f59e0b; border-radius:4px;">
        <p style="font-weight:bold; color:#d97706; margin-bottom:8px;">Itens com irregularidade registrada:</p>
        ${issueItems.map(e => `<p style="font-size:12px; margin-bottom:4px;">• ${e.item}: ${e.observation || e.status}</p>`).join('')}
      </div>
    ` : '<p style="color:#16a34a; font-size:13px; margin-top:10px;">✓ Todos os itens conferidos e aceitos em perfeito estado.</p>'}
  </div>

  <p class="text-justify mt-20">
    As partes declaram que leram, entenderam e concordam com todas as cláusulas do presente contrato,
    assinando-o em 2 (duas) vias de igual teor, na data indicada.
  </p>

  <p style="margin-top: 30px; text-align: right;">
    Cuiabá – MT, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
  </p>

  <div class="signatures">
    <div class="signature-line">
      <strong>LEINER PAULA CHICATI</strong>
      <span>CPF: 027.926.611-19</span>
      <span>(Locadora)</span>
    </div>
    <div class="signature-line">
      <strong>${profile?.name?.toUpperCase() || '______________________________'}</strong>
      <span>CPF: ${fullProfile?.cpf || '______________________________'}</span>
      <span>(Locatária)</span>
    </div>
  </div>

  <div class="signatures" style="margin-top: 60px;">
    <div class="signature-line">
      <strong>TESTEMUNHA 1</strong>
      <span>Nome: _______________________________</span>
      <span>CPF: ________________________________</span>
    </div>
    <div class="signature-line">
      <strong>TESTEMUNHA 2</strong>
      <span>Nome: _______________________________</span>
      <span>CPF: ________________________________</span>
    </div>
  </div>

  <p style="text-align: center; margin-top: 20px; font-size: 10px; color: #bbb;">
    Reserva nº ${booking.id.substring(0, 8).toUpperCase()} — Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}.
  </p>

  <script>window.print();</script>
</body>
</html>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ChecklistHandoverModal = ({
    open,
    onOpenChange,
    booking,
    profile,
    onRefresh,
}: ChecklistHandoverModalProps) => {
    const { items: inventoryItems, loading: inventoryLoading } = useInventory();

    const [entries, setEntries] = useState<ChecklistEntry[]>([]);
    const [customItems, setCustomItems] = useState<ChecklistEntry[]>([]);
    const [newCustomItem, setNewCustomItem] = useState('');
    const [expandedObs, setExpandedObs] = useState<Set<string>>(new Set());
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    const [finalBalancePaid, setFinalBalancePaid] = useState(false);
    const [depositPaid, setDepositPaid] = useState(false);

    const [phase, setPhase] = useState<'checklist' | 'share'>('checklist');
    const [saving, setSaving] = useState(false);
    const [contractHtml, setContractHtml] = useState('');
    const [fullProfile, setFullProfile] = useState<Record<string, any>>({});

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!booking || !open) return;
        setDepositPaid((booking as any).deposit_paid || false);
        setFinalBalancePaid((booking as any).final_balance_paid || false);
        setPhase('checklist');

        // Load existing checklist_data if already saved
        const existing = (booking as any).checklist_data as ChecklistEntry[] | null;
        if (existing && existing.length > 0) {
            const invIds = new Set(inventoryItems.map(i => i.id));
            setEntries(existing.filter(e => invIds.has(e.id)));
            setCustomItems(existing.filter(e => !invIds.has(e.id)));
        } else if (inventoryItems.length > 0) {
            setEntries(buildInventoryEntries(inventoryItems));
        }
    }, [booking, open, inventoryItems]);

    useEffect(() => {
        if (!profile?.id || !open) return;
        supabase.from('profiles').select('*').eq('id', profile.id).single()
            .then(({ data }) => { if (data) setFullProfile(data as any); });
    }, [profile, open]);

    if (!booking) return null;

    // ── Calculations ──────────────────────────────────────────────────────────
    const finalPrice = Number(booking.total_price) || Number(booking.price) + (booking.waive_cleaning_fee ? 0 : Number(booking.cleaning_fee));
    const depositAmount = Math.round(finalPrice / 2);
    const remainingBalance = finalPrice - (depositPaid ? depositAmount : 0);

    // ── Checklist mutation ────────────────────────────────────────────────────
    const updateEntry = (id: string, field: 'status' | 'observation', value: string) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
        if (field === 'status' && (value === 'observation' || value === 'problem')) {
            setExpandedObs(prev => new Set(prev).add(id));
        }
    };

    const updateCustom = (id: string, field: 'status' | 'observation', value: string) => {
        setCustomItems(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
        if (field === 'status' && (value === 'observation' || value === 'problem')) {
            setExpandedObs(prev => new Set(prev).add(id));
        }
    };

    const toggleObs = (id: string) => {
        setExpandedObs(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleCategory = (cat: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            next.has(cat) ? next.delete(cat) : next.add(cat);
            return next;
        });
    };

    const addCustomItem = () => {
        if (!newCustomItem.trim()) return;
        const entry: ChecklistEntry = {
            id: `custom_${Date.now()}`,
            item: newCustomItem.trim(),
            category: 'Adicional',
            status: 'ok',
            observation: '',
        };
        setCustomItems(prev => [...prev, entry]);
        setNewCustomItem('');
    };

    const removeCustomItem = (id: string) => {
        setCustomItems(prev => prev.filter(e => e.id !== id));
    };

    // ── Finalize Handover ─────────────────────────────────────────────────────
    const handleFinalizeHandover = async () => {
        setSaving(true);
        const allEntries = [...entries, ...customItems];

        try {
            // 1. Save checklist_data + mark final_balance_paid + complete booking
            const { error: bookingError } = await (supabase as any)
                .from('bookings')
                .update({
                    checklist_data: allEntries,
                    final_balance_paid: finalBalancePaid,
                    status: 'completed',
                    checklist_confirmed: true,
                })
                .eq('id', booking.id);

            if (bookingError) throw bookingError;

            // 2. Generate contract HTML
            const html = generateContractHTML(
                booking, profile, fullProfile, allEntries,
                depositAmount, remainingBalance, depositPaid, finalBalancePaid,
            );
            setContractHtml(html);

            // 3. Save contract to contracts table
            await (supabase as any).from('contracts').insert({
                booking_id: booking.id,
                profile_id: profile?.id || null,
                html_content: html,
            });

            toast.success('Entrega confirmada! Contrato gerado.');
            await onRefresh();
            setPhase('share');
        } catch (err: any) {
            toast.error('Erro ao finalizar entrega: ' + err.message);
        }
        setSaving(false);
    };

    // ── Share helpers ─────────────────────────────────────────────────────────
    const buildWhatsAppSummary = () => {
        const dateStr = format(parseISO(booking.booking_date), "dd/MM/yyyy", { locale: ptBR });
        const issueCount = [...entries, ...customItems].filter(e => e.status !== 'ok').length;
        const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
        return encodeURIComponent(
            `*Contrato EJ Eventos* 🎉\n\n` +
            `Olá *${profile?.name}*!\n\n` +
            `Sua reserva do dia *${dateStr}* foi concluída com sucesso.\n\n` +
            `📋 *Checklist de entrega:*\n` +
            `• Total de itens verificados: ${entries.length + customItems.length}\n` +
            (issueCount > 0 ? `• Itens com observação: ${issueCount}\n` : `• Todos os itens em perfeito estado ✅\n`) +
            `\n💰 *Pagamentos:*\n` +
            `• Sinal: ${depositPaid ? 'Confirmado ✅' : 'Pendente ⏳'}\n` +
            `• Saldo final: ${finalBalancePaid ? 'Confirmado ✅' : 'Pendente ⏳'}\n` +
            `\nObrigada pela preferência! 💜\n` +
            `*EJ Eventos* — (65) 99228-6607`
        );
    };

    const buildOwnerSummary = () => {
        const dateStr = format(parseISO(booking.booking_date), "dd/MM/yyyy", { locale: ptBR });
        const issueItems = [...entries, ...customItems].filter(e => e.status !== 'ok');
        return encodeURIComponent(
            `*Resumo de Entrega — EJ Eventos* 📋\n\n` +
            `Reserva: *${dateStr}*\n` +
            `Cliente: *${profile?.name}*\n` +
            `Tel: ${profile?.phone || '-'}\n\n` +
            `💰 Sinal: ${depositPaid ? 'Pago ✅' : 'Pendente ⚠️'}\n` +
            `💰 Saldo: ${finalBalancePaid ? 'Pago ✅' : 'Pendente ⚠️'}\n\n` +
            (issueItems.length > 0
                ? `⚠️ *Itens com problemas/observações:*\n` + issueItems.map(e => `• ${e.item}: ${e.observation || e.status}`).join('\n')
                : `✅ Todos os itens em perfeito estado.\n`) +
            `\nContrato salvo no sistema.`
        );
    };

    const openEmail = () => {
        const dateStr = format(parseISO(booking.booking_date), "dd/MM/yyyy", { locale: ptBR });
        const subject = encodeURIComponent(`Contrato EJ Eventos — ${dateStr}`);
        const body = encodeURIComponent(
            `Olá ${profile?.name},\n\nSegue em anexo seu contrato de locação do espaço EJ Eventos para o dia ${dateStr}.\n\nAtenciosamente,\nLeiner — EJ Eventos\nTel: (65) 99228-6607`
        );
        window.open(`mailto:${profile?.email || ''}?subject=${subject}&body=${body}`, '_blank');
    };

    const openPrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(contractHtml);
        printWindow.document.close();
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const grouped = groupByCategory(entries);
    const allEntries = [...entries, ...customItems];
    const issueCount = allEntries.filter(e => e.status !== 'ok').length;
    const totalItems = allEntries.length;

    const StatusButtons = ({ entry, onUpdate }: { entry: ChecklistEntry; onUpdate: (id: string, field: 'status' | 'observation', value: string) => void }) => (
        <div className="flex gap-1">
            {(['ok', 'observation', 'problem'] as ChecklistItemStatus[]).map(s => (
                <button
                    key={s}
                    onClick={() => onUpdate(entry.id, 'status', s)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all border ${entry.status === s
                            ? s === 'ok' ? 'bg-success text-white border-success'
                                : s === 'observation' ? 'bg-warning text-white border-warning'
                                    : 'bg-destructive text-white border-destructive'
                            : 'bg-background text-muted-foreground border-border hover:border-foreground'
                        }`}
                >
                    {s === 'ok' ? '✓ OK' : s === 'observation' ? '⚠ Obs.' : '✗ Prob.'}
                </button>
            ))}
            <button
                onClick={() => toggleObs(entry.id)}
                className="px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground transition-all"
                title="Adicionar observação"
            >
                {expandedObs.has(entry.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        Checklist de Entrega
                    </DialogTitle>
                    <DialogDescription>
                        {profile?.name} — {format(parseISO(booking.booking_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </DialogDescription>
                </DialogHeader>

                {/* ── Phase: Checklist ── */}
                {phase === 'checklist' && (
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                        {/* Progress bar */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{totalItems} itens</span>
                            <div className="flex gap-3">
                                <span className="text-success font-medium">{allEntries.filter(e => e.status === 'ok').length} OK</span>
                                <span className="text-warning font-medium">{allEntries.filter(e => e.status === 'observation').length} obs.</span>
                                <span className="text-destructive font-medium">{allEntries.filter(e => e.status === 'problem').length} prob.</span>
                            </div>
                        </div>

                        {inventoryLoading ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Carregando inventário...
                            </div>
                        ) : (
                            <>
                                {/* Inventory items by category */}
                                {Object.entries(grouped).map(([category, catEntries]) => (
                                    <div key={category} className="border border-border rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 transition-colors text-left"
                                        >
                                            <span className="font-semibold text-sm">{category}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {catEntries.filter(e => e.status === 'ok').length}/{catEntries.length} OK
                                                </Badge>
                                                {collapsedCategories.has(category) ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                            </div>
                                        </button>
                                        {!collapsedCategories.has(category) && (
                                            <div className="divide-y divide-border">
                                                {catEntries.map(entry => (
                                                    <div key={entry.id} className="px-4 py-3 space-y-2">
                                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                                            <div className="flex items-center gap-2">
                                                                {statusIcon(entry.status)}
                                                                <span className="text-sm">{entry.item}</span>
                                                            </div>
                                                            <StatusButtons entry={entry} onUpdate={updateEntry} />
                                                        </div>
                                                        {expandedObs.has(entry.id) && (
                                                            <Textarea
                                                                placeholder="Descreva a observação ou problema..."
                                                                value={entry.observation}
                                                                onChange={(e) => updateEntry(entry.id, 'observation', e.target.value)}
                                                                className="text-sm h-16 resize-none"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Custom items */}
                                {customItems.length > 0 && (
                                    <div className="border border-dashed border-border rounded-xl overflow-hidden">
                                        <div className="px-4 py-3 bg-muted/50">
                                            <span className="font-semibold text-sm">Itens Adicionais</span>
                                        </div>
                                        <div className="divide-y divide-border">
                                            {customItems.map(entry => (
                                                <div key={entry.id} className="px-4 py-3 space-y-2">
                                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            {statusIcon(entry.status)}
                                                            <span className="text-sm">{entry.item}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <StatusButtons entry={entry} onUpdate={updateCustom} />
                                                            <button onClick={() => removeCustomItem(entry.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {expandedObs.has(entry.id) && (
                                                        <Textarea
                                                            placeholder="Descreva a observação ou problema..."
                                                            value={entry.observation}
                                                            onChange={(e) => updateCustom(entry.id, 'observation', e.target.value)}
                                                            className="text-sm h-16 resize-none"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add custom item */}
                                <div className="flex gap-2">
                                    <Input
                                        value={newCustomItem}
                                        onChange={e => setNewCustomItem(e.target.value)}
                                        placeholder="Adicionar item extra ao checklist..."
                                        onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                                        className="text-sm"
                                    />
                                    <Button variant="outline" size="icon" onClick={addCustomItem}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Payment confirmation */}
                        <div className="space-y-3 bg-muted/40 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-primary" />
                                <span className="font-semibold text-sm">Confirmação de Pagamento</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Sinal (50%)</p>
                                    <p className="text-xs text-muted-foreground">R$ {depositAmount},00</p>
                                </div>
                                <Switch checked={depositPaid} onCheckedChange={setDepositPaid} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Saldo Final — Entrega da Chave</p>
                                    <p className="text-xs text-muted-foreground">R$ {remainingBalance},00</p>
                                </div>
                                <Switch checked={finalBalancePaid} onCheckedChange={setFinalBalancePaid} disabled={!depositPaid} />
                            </div>
                        </div>

                        {/* Issue summary banner */}
                        {issueCount > 0 && (
                            <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 text-warning text-sm">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{issueCount} {issueCount === 1 ? 'item com observação/problema registrado' : 'itens com observações/problemas registrados'}. Serão incluídos no contrato.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Phase: Share ── */}
                {phase === 'share' && (
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                        <div className="flex flex-col items-center text-center gap-3 py-4">
                            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                                <CheckCircle className="w-9 h-9 text-success" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">Entrega confirmada!</p>
                                <p className="text-muted-foreground text-sm">Contrato gerado e salvo. Compartilhe com as partes.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp</p>
                            <Button
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white justify-start gap-3"
                                onClick={() => window.open(`https://wa.me/55${profile?.phone?.replace(/\D/g, '')}?text=${buildWhatsAppSummary()}`, '_blank')}
                                disabled={!profile?.phone}
                            >
                                <MessageSquare className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-medium">Enviar ao Cliente</p>
                                    <p className="text-xs opacity-80">{profile?.phone || 'Sem telefone cadastrado'}</p>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 justify-start gap-3"
                                onClick={() => window.open(`https://wa.me/${OWNER_PHONE}?text=${buildOwnerSummary()}`, '_blank')}
                            >
                                <MessageSquare className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-medium">Enviar para Proprietária</p>
                                    <p className="text-xs opacity-60">(65) 99228-6607 — EJ Eventos</p>
                                </div>
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={openEmail}
                                disabled={!profile?.email}
                            >
                                <Mail className="w-5 h-5 text-primary" />
                                <div className="text-left">
                                    <p className="font-medium">Enviar por Email</p>
                                    <p className="text-xs text-muted-foreground">{profile?.email || 'Cliente sem email cadastrado'}</p>
                                </div>
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contrato</p>
                            <Button variant="outline" className="w-full justify-start gap-3" onClick={openPrint}>
                                <Printer className="w-5 h-5" />
                                <span>Imprimir / Salvar PDF</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t flex-shrink-0 flex gap-3">
                    {phase === 'checklist' ? (
                        <>
                            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-gradient-primary hover:opacity-90 font-semibold"
                                onClick={handleFinalizeHandover}
                                disabled={saving}
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Finalizando...</>
                                ) : (
                                    <><CheckCircle className="w-4 h-4 mr-2" /> Finalizar Entrega</>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button className="flex-1" variant="outline" onClick={() => onOpenChange(false)}>
                            Fechar
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChecklistHandoverModal;
