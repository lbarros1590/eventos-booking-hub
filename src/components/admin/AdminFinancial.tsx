import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useApp, Expense } from '@/contexts/AppContext';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
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
  Edit2,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MONTHS = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

const AdminFinancial = () => {
  const { bookings, expenses, profiles, addExpense, updateExpense, deleteExpense } = useApp();
  
  // Filter state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('other');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter data for selected period
  const monthlyBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bookingDate = parseISO(b.booking_date);
      const bookingMonth = bookingDate.getMonth();
      const bookingYear = bookingDate.getFullYear();
      return bookingMonth === selectedMonth && bookingYear === selectedYear && b.status !== 'cancelled';
    });
  }, [bookings, selectedMonth, selectedYear]);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const expDate = parseISO(e.expense_date);
      const expMonth = expDate.getMonth();
      const expYear = expDate.getFullYear();
      return expMonth === selectedMonth && expYear === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Calculate confirmed income (deposits + full payments received)
  const confirmedIncome = useMemo(() => {
    return monthlyBookings.reduce((sum, b) => {
      let received = 0;
      const total = Number(b.total_price);
      const deposit = Math.round(total / 2);
      
      if (b.deposit_paid) received += deposit;
      if (b.final_balance_paid) received += (total - deposit);
      
      return sum + received;
    }, 0);
  }, [monthlyBookings]);

  // Calculate receivables (scheduled balances)
  const scheduledReceivables = useMemo(() => {
    return monthlyBookings.reduce((sum, b) => {
      const total = Number(b.total_price);
      const deposit = Math.round(total / 2);
      let pending = 0;
      
      if (!b.deposit_paid) pending += deposit;
      if (!b.final_balance_paid) pending += (total - deposit);
      
      return sum + pending;
    }, 0);
  }, [monthlyBookings]);

  const totalExpenses = useMemo(() => {
    return monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [monthlyExpenses]);

  const netBalance = confirmedIncome - totalExpenses;

  // Yearly data for line chart
  const yearlyData = useMemo(() => {
    return MONTHS.map((month) => {
      const monthBookings = bookings.filter((b) => {
        const bookingDate = parseISO(b.booking_date);
        return bookingDate.getMonth() === month.value && 
               bookingDate.getFullYear() === selectedYear && 
               b.status !== 'cancelled';
      });

      const monthExpenses = expenses.filter((e) => {
        const expDate = parseISO(e.expense_date);
        return expDate.getMonth() === month.value && expDate.getFullYear() === selectedYear;
      });

      const income = monthBookings.reduce((sum, b) => {
        let received = 0;
        const total = Number(b.total_price);
        const deposit = Math.round(total / 2);
        if (b.deposit_paid) received += deposit;
        if (b.final_balance_paid) received += (total - deposit);
        return sum + received;
      }, 0);

      const expenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        name: month.label.substring(0, 3),
        receitas: income,
        despesas: expenseTotal,
      };
    });
  }, [bookings, expenses, selectedYear]);

  // Daily data for bar chart
  const dailyData = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const end = endOfMonth(start);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayStr = day.toISOString().split('T')[0];
      
      const dayBookings = bookings.filter((b) => {
        return b.booking_date === dayStr && b.status !== 'cancelled';
      });

      const income = dayBookings.reduce((sum, b) => {
        let received = 0;
        const total = Number(b.total_price);
        const deposit = Math.round(total / 2);
        if (b.deposit_paid) received += deposit;
        if (b.final_balance_paid) received += (total - deposit);
        return sum + received;
      }, 0);

      return {
        day: format(day, 'dd'),
        valor: income,
      };
    });
  }, [bookings, selectedMonth, selectedYear]);

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
      expense_date: expenseDate,
      payment_date: paymentDate,
    });

    toast.success('Despesa adicionada com sucesso');
    setDescription('');
    setAmount('');
    setCategory('other');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setLoading(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;
    
    setLoading(true);
    await updateExpense(editingExpense.id, {
      description: editingExpense.description,
      amount: editingExpense.amount,
      category: editingExpense.category,
      expense_date: editingExpense.expense_date,
      payment_date: editingExpense.payment_date,
    });
    
    toast.success('Despesa atualizada');
    setEditModalOpen(false);
    setEditingExpense(null);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Controle Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie receitas e despesas
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
            <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-32 border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-20 border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas Confirmadas</p>
                <p className="text-2xl font-bold text-success mt-1">
                  R$ {confirmedIncome.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Pagamentos recebidos
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  R$ {scheduledReceivables.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Saldos pendentes
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saídas/Despesas</p>
                <p className="text-2xl font-bold text-destructive mt-1">
                  R$ {totalExpenses.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" />
                  {monthlyExpenses.length} registros
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
                <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {netBalance.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Receitas - Despesas
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netBalance >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <DollarSign className={`w-6 h-6 ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Yearly Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas - {selectedYear}</CardTitle>
            <CardDescription>Evolução mensal ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="receitas" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Receitas"
                    dot={{ fill: 'hsl(var(--success))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="despesas" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Despesas"
                    dot={{ fill: 'hsl(var(--destructive))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Entradas Diárias - {MONTHS[selectedMonth].label}</CardTitle>
            <CardDescription>Pagamentos recebidos por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                  />
                  <Bar 
                    dataKey="valor" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Data da Despesa</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Data do Pagamento</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
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
                {monthlyBookings.map((booking) => {
                  const total = Number(booking.total_price);
                  const deposit = Math.round(total / 2);
                  let received = 0;
                  if (booking.deposit_paid) received += deposit;
                  if (booking.final_balance_paid) received += (total - deposit);
                  
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 bg-success/5 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">{getUserName(booking.user_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(booking.booking_date), 'dd/MM/yyyy')}
                          {booking.discount_applied && Number(booking.discount_applied) > 0 && (
                            <span className="ml-2 text-accent">
                              (-R$ {Number(booking.discount_applied).toFixed(0)} desc.)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-success block">
                          +R$ {received.toFixed(0)}
                        </span>
                        {received < total && (
                          <span className="text-xs text-muted-foreground">
                            de R$ {total.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  <TableHead>Data Despesa</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-24"></TableHead>
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
                    <TableCell>
                      {expense.payment_date ? format(parseISO(expense.payment_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      -R$ {Number(expense.amount).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Expense Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>Atualize os dados da despesa</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={editingExpense.category} 
                    onValueChange={(v) => setEditingExpense({ ...editingExpense, category: v as Expense['category'] })}
                  >
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Despesa</Label>
                  <Input
                    type="date"
                    value={editingExpense.expense_date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, expense_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data do Pagamento</Label>
                  <Input
                    type="date"
                    value={editingExpense.payment_date || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, payment_date: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveEdit}
                disabled={loading}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinancial;
