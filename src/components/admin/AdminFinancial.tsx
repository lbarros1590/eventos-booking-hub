import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp, Expense } from '@/contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Zap,
  Droplets,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';

const AdminFinancial = () => {
  const { bookings, expenses, profiles, addExpense, deleteExpense } = useApp();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('other');
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter data for current month
  const monthlyBookings = bookings.filter((b) => {
    const bookingDate = parseISO(b.booking_date);
    const bookingMonth = bookingDate.getMonth();
    const bookingYear = bookingDate.getFullYear();
    return bookingMonth === currentMonth && bookingYear === currentYear && b.status !== 'cancelled';
  });

  const monthlyExpenses = expenses.filter((e) => {
    const expenseDate = parseISO(e.expense_date);
    const expenseMonth = expenseDate.getMonth();
    const expenseYear = expenseDate.getFullYear();
    return expenseMonth === currentMonth && expenseYear === currentYear;
  });

  const totalIncome = monthlyBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const profit = totalIncome - totalExpenses;

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.name || 'Cliente';
  };

  const handleAddExpense = async () => {
    if (!description || !amount) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    await addExpense({
      description,
      amount: parseFloat(amount),
      category,
      expense_date: new Date().toISOString().split('T')[0],
    });

    toast.success('Despesa adicionada com sucesso');
    setDescription('');
    setAmount('');
    setCategory('other');
    setLoading(false);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
    toast.success('Despesa removida');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electricity':
        return <Zap className="w-4 h-4 text-warning" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-primary" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-muted-foreground" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'electricity':
        return 'Luz';
      case 'water':
        return 'Água';
      case 'maintenance':
        return 'Manutenção';
      default:
        return 'Outros';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Controle Financeiro
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie receitas e despesas do mês
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold text-success mt-1">
                  R$ {totalIncome.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-destructive mt-1">
                  R$ {totalExpenses.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro</p>
                <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {profit.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <DollarSign className={`w-6 h-6 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Despesa</CardTitle>
            <CardDescription>Registre uma nova despesa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Conta de Luz"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Expense['category'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricity">Luz</SelectItem>
                    <SelectItem value="water">Água</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleAddExpense}
              className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground"
              disabled={loading}
            >
              <Plus className="mr-2" size={20} />
              {loading ? 'Adicionando...' : 'Adicionar Despesa'}
            </Button>
          </CardContent>
        </Card>

        {/* Income List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-success">Receitas do Mês</CardTitle>
            <CardDescription>Reservas confirmadas e pagas</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma receita este mês
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {monthlyBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-success/5 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{getUserName(booking.user_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(booking.booking_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <span className="font-semibold text-success">
                      +R$ {Number(booking.total_price).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Despesas do Mês</CardTitle>
          <CardDescription>Lista de todas as despesas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyExpenses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma despesa registrada este mês
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(expense.category)}
                        <span>{getCategoryLabel(expense.category)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(parseISO(expense.expense_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      -R$ {Number(expense.amount).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
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

export default AdminFinancial;
