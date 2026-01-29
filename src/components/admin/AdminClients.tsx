import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Users, Phone, Gift, Award } from 'lucide-react';
import { LOYALTY_THRESHOLD } from '@/lib/constants';

const AdminClients = () => {
  const { users, grantDiscount } = useApp();

  const clients = users.filter((u) => u.role === 'user');

  const handleGrantDiscount = (userId: string, userName: string) => {
    grantDiscount(userId);
    toast.success(`Desconto concedido para ${userName}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Gestão de Clientes
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie seus clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold text-foreground mt-1">{clients.length}</p>
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
                  {clients.filter((c) => c.reservationCount >= LOYALTY_THRESHOLD).length}
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
                  {clients.filter((c) => c.hasDiscount).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-success" />
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
          {clients.length === 0 ? (
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
                  <TableHead>Reservas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{client.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{client.reservationCount}</span>
                        <span className="text-muted-foreground text-sm">
                          / {LOYALTY_THRESHOLD}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.hasDiscount ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Desconto Ativo
                        </Badge>
                      ) : client.reservationCount >= LOYALTY_THRESHOLD ? (
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
                      {!client.hasDiscount && (
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClients;
