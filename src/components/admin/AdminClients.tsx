import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Users, Phone, Gift, Award, Cake, Plus, MessageCircle, Calendar } from 'lucide-react';
import { LOYALTY_THRESHOLD, BUSINESS_INFO } from '@/lib/constants';
import { format, parseISO, isToday, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminClients = () => {
  const { profiles, bookings, grantDiscount, createManualClient } = useApp();
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBirthDate, setNewClientBirthDate] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGrantDiscount = async (userId: string, userName: string) => {
    await grantDiscount(userId);
    toast.success(`Desconto concedido para ${userName}`);
  };

  const getBookingCount = (userId: string) => {
    return bookings.filter(b => b.user_id === userId && b.status !== 'cancelled').length;
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

    setLoading(true);
    const result = await createManualClient({
      name: newClientName,
      phone: newClientPhone,
      birth_date: newClientBirthDate || null,
      email: newClientEmail || null,
    });

    if (result.error) {
      toast.error('Erro ao adicionar cliente');
    } else {
      toast.success('Cliente adicionado com sucesso!');
      setAddClientModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientBirthDate('');
      setNewClientEmail('');
    }
    setLoading(false);
  };

  // Sort profiles with birthday people first
  const sortedProfiles = [...profiles].sort((a, b) => {
    const aIsBirthday = isBirthday(a.birth_date);
    const bIsBirthday = isBirthday(b.birth_date);
    if (aIsBirthday && !bIsBirthday) return -1;
    if (!aIsBirthday && bIsBirthday) return 1;
    return a.name.localeCompare(b.name);
  });

  const birthdayCount = profiles.filter(p => isBirthday(p.birth_date)).length;

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
      <div className="grid sm:grid-cols-4 gap-4">
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

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>Todos os clientes cadastrados na plataforma</CardDescription>
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
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data Nasc.</TableHead>
                  <TableHead>Total Reservas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProfiles.map((client) => {
                  const isClientBirthday = isBirthday(client.birth_date);
                  const age = calculateAge(client.birth_date);
                  const totalBookings = getBookingCount(client.user_id);
                  
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.birth_date 
                          ? format(parseISO(client.birth_date), 'dd/MM/yyyy')
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
                              onClick={() => handleGrantDiscount(client.user_id, client.name)}
                              className="text-accent hover:text-accent hover:bg-accent/10"
                            >
                              <Gift className="w-4 h-4 mr-1" />
                              Dar Desconto
                            </Button>
                          )}
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
        <DialogContent className="sm:max-w-md">
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

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
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
    </div>
  );
};

export default AdminClients;
