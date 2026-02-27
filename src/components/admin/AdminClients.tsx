import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/contexts/DataContext';
import { Profile } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Phone, Gift, Award, Cake, Plus, MessageCircle, Calendar, Mail, User, Edit2, Trash2, KeyRound, AlertTriangle } from 'lucide-react';
import { LOYALTY_THRESHOLD } from '@/lib/constants';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminClients = () => {
  const { profiles, bookings, grantDiscount, createManualClient, refreshProfiles } = useData();
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Profile | null>(null);
  const [deleteClient, setDeleteClient] = useState<Profile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Add form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBirthDate, setNewClientBirthDate] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCpf, setNewClientCpf] = useState('');
  const [newClientRg, setNewClientRg] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Edit form
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editRg, setEditRg] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');

  const handleGrantDiscount = async (profileId: string, profileName: string) => {
    await grantDiscount(profileId);
    toast.success(`Desconto concedido para ${profileName}`);
  };

  const openEditModal = async (client: Profile) => {
    // Fetch fresh CPF/RG/address from Supabase
    const { data } = await (supabase as any).from('profiles').select('*').eq('id', client.id).single();
    const fresh = data || client;
    setEditClient(client);
    setEditName(fresh.name || '');
    setEditPhone(fresh.phone || '');
    setEditEmail(fresh.email || '');
    setEditCpf(fresh.cpf || '');
    setEditRg(fresh.rg || '');
    setEditAddress(fresh.address || '');
    setEditBirthDate(fresh.birth_date || '');
  };

  const handleSaveEdit = async () => {
    if (!editClient) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        name: editName,
        phone: editPhone,
        email: editEmail || null,
        cpf: editCpf || null,
        rg: editRg || null,
        address: editAddress || null,
        birth_date: editBirthDate || null,
      })
      .eq('id', editClient.id);

    if (error) {
      toast.error('Erro ao atualizar cliente: ' + error.message);
    } else {
      toast.success('Cliente atualizado com sucesso!');
      setEditClient(null);
      if (refreshProfiles) await refreshProfiles();
    }
    setSaving(false);
  };

  const handleDeleteClient = async () => {
    if (!deleteClient) return;
    setDeletingId(deleteClient.id);
    const { error } = await (supabase as any)
      .from('profiles')
      .delete()
      .eq('id', deleteClient.id);

    if (error) {
      toast.error('Erro ao excluir cliente: ' + error.message);
    } else {
      toast.success('Cliente excluído com sucesso!');
      setDeleteClient(null);
      if (refreshProfiles) await refreshProfiles();
    }
    setDeletingId(null);
  };

  const handleSendPasswordReset = async (email: string | null, name: string) => {
    if (!email) {
      toast.error(`${name} não possui email cadastrado para recuperação de senha.`);
      return;
    }
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });
    if (error) {
      toast.error('Erro ao enviar email de recuperação: ' + error.message);
    } else {
      toast.success(`Email de recuperação enviado para ${email}`);
    }
  };

  const getBookingCount = (profileId: string) => {
    return bookings.filter(b => b.profile_id === profileId && b.status !== 'cancelled').length;
  };

  const isBirthday = (birthDate: string | null) => {
    if (!birthDate) return false;
    const date = parseISO(birthDate);
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const handleSendBirthdayMessage = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `🎂 Olá ${name}! A equipe do EJ Eventos deseja a você um Feliz Aniversário! 🎉\n\nQue tal comemorar com a gente? Entre em contato para reservar seu espaço com condições especiais de aniversariante! 🎁`
    );
    const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddClient = async () => {
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
      cpf: newClientCpf || null,
      rg: newClientRg || null,
      address: newClientAddress || null,
    });

    if (result.error) {
      toast.error('Erro ao adicionar cliente: ' + result.error.message);
    } else {
      toast.success('Cliente adicionado com sucesso!');
      setAddClientModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientBirthDate('');
      setNewClientEmail('');
      setNewClientCpf('');
      setNewClientRg('');
      setNewClientAddress('');
    }
    setLoading(false);
  };

  // Filter profiles by search
  const filteredProfiles = profiles.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.phone && p.phone.includes(query)) ||
      (p.email && p.email.toLowerCase().includes(query))
    );
  });

  // Sort profiles with birthday people first
  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    const aIsBirthday = isBirthday(a.birth_date);
    const bIsBirthday = isBirthday(b.birth_date);
    if (aIsBirthday && !bIsBirthday) return -1;
    if (!aIsBirthday && bIsBirthday) return 1;
    return a.name.localeCompare(b.name);
  });

  const birthdayCount = profiles.filter(p => isBirthday(p.birth_date)).length;
  const manualClientsCount = profiles.filter(p => p.user_id === null).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie seus clientes
          </p>
        </div>
        <Button
          onClick={() => setAddClientModalOpen(true)}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold text-foreground mt-1">{profiles.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Manuais</p>
                <p className="text-2xl font-bold text-foreground mt-1">{manualClientsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Fidelizados</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {profiles.filter((c) => c.reservation_count >= LOYALTY_THRESHOLD).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Desconto Ativo</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {profiles.filter((c) => c.has_discount).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={birthdayCount > 0 ? 'ring-2 ring-accent' : ''}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aniversariantes Hoje</p>
                <p className="text-2xl font-bold text-foreground mt-1">{birthdayCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Cake className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Todos os clientes cadastrados ({sortedProfiles.length} de {profiles.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Data Nasc.</TableHead>
                  <TableHead>Reservas</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProfiles.map((client) => {
                  const isClientBirthday = isBirthday(client.birth_date);
                  const age = calculateAge(client.birth_date);
                  const totalBookings = getBookingCount(client.id);
                  const isManualClient = client.user_id === null;

                  return (
                    <TableRow key={client.id} className={isClientBirthday ? 'bg-warning/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isClientBirthday && (
                            <span className="text-xl" title="Aniversariante hoje!">🎂</span>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            {age !== null && (
                              <p className="text-xs text-muted-foreground">{age} anos</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Phone className="w-3 h-3" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Mail className="w-3 h-3" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {!client.phone && !client.email && (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.birth_date
                          ? format(parseISO(client.birth_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{totalBookings}</span>
                          <span className="text-muted-foreground text-sm">
                            / {LOYALTY_THRESHOLD}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isManualClient ? (
                          <Badge variant="outline" className="bg-secondary text-muted-foreground">
                            Manual
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            Online
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.has_discount ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            Desconto Ativo
                          </Badge>
                        ) : client.reservation_count >= LOYALTY_THRESHOLD ? (
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                            Elegível
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Regular
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isClientBirthday && client.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendBirthdayMessage(client.phone!, client.name)}
                              className="text-warning hover:text-warning hover:bg-warning/10"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Parabéns
                            </Button>
                          )}
                          {!client.has_discount && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGrantDiscount(client.id, client.name)}
                              className="text-accent hover:text-accent hover:bg-accent/10"
                            >
                              <Gift className="w-4 h-4 mr-1" />
                              Dar Desconto
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendPasswordReset(client.email, client.name)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Enviar email de recuperação de senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(client)}
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteClient(client)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Excluir cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <Dialog open={addClientModalOpen} onOpenChange={setAddClientModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Cliente Manual</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente sem necessidade de email/senha
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome Completo *</Label>
              <Input
                id="clientName"
                placeholder="Nome do cliente"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Telefone/WhatsApp *</Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="(65) 99999-0000"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="clientCpf">CPF</Label>
                <Input
                  id="clientCpf"
                  placeholder="000.000.000-00"
                  value={newClientCpf}
                  onChange={(e) => setNewClientCpf(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientRg">RG</Label>
                <Input
                  id="clientRg"
                  placeholder="0000000-0"
                  value={newClientRg}
                  onChange={(e) => setNewClientRg(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientAddress">Endereço</Label>
              <Input
                id="clientAddress"
                placeholder="Rua, número, bairro, cidade"
                value={newClientAddress}
                onChange={(e) => setNewClientAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email (opcional)</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientBirthDate">Data de Nascimento</Label>
              <Input
                id="clientBirthDate"
                type="date"
                value={newClientBirthDate}
                onChange={(e) => setNewClientBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Button
              onClick={handleAddClient}
              disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {loading ? 'Adicionando...' : 'Adicionar Cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Client Modal */}
      <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize os dados de {editClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nome Completo *</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Telefone/WhatsApp *</Label>
              <Input id="editPhone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="(65) 99999-0000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editCpf">CPF</Label>
                <Input id="editCpf" value={editCpf} onChange={(e) => setEditCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRg">RG</Label>
                <Input id="editRg" value={editRg} onChange={(e) => setEditRg(e.target.value)} placeholder="0000000-0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">Endereço</Label>
              <Input id="editAddress" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email (opcional)</Label>
              <Input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBirthDate">Data de Nascimento</Label>
              <Input id="editBirthDate" type="date" value={editBirthDate} onChange={(e) => setEditBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setEditClient(null)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-gradient-primary hover:opacity-90">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Excluir Cliente
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteClient?.name}</strong>?
              Esta ação não pode ser desfeita e também excluirá o histórico de reservas vinculado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setDeleteClient(null)} className="flex-1">Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={deletingId === deleteClient?.id}
              className="flex-1"
            >
              {deletingId ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;
