import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, Receipt, PiggyBank, FileText } from 'lucide-react';

const AdminReports = () => {
  const { profiles, bookings, expenses } = useData();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const filteredData = useMemo(() => {
    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    const startDate = startOfMonth(new Date(year, month));
    const endDate = endOfMonth(new Date(year, month));

    const filteredBookings = bookings.filter(booking => {
      const bookingDate = parseISO(booking.booking_date);
      return isWithinInterval(bookingDate, { start: startDate, end: endDate }) &&
        booking.status !== 'cancelled';
    });

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.expense_date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });

    const totalRevenue = filteredBookings.reduce((sum, b) => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        return sum + Number(b.total_price);
      }
      return sum;
    }, 0);

    const pendingRevenue = filteredBookings.reduce((sum, b) => {
      if (b.status === 'pending') {
        return sum + Number(b.total_price);
      }
      return sum;
    }, 0);

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      bookings: filteredBookings,
      expenses: filteredExpenses,
      totalRevenue,
      pendingRevenue,
      totalExpenses,
      netProfit,
    };
  }, [bookings, expenses, selectedMonth, selectedYear]);

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.user_id === userId);
    return profile?.name || 'Cliente';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pendente</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Confirmada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Concluída</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Relatórios Financeiros
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize receitas, despesas e lucro por período
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Confirmada</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {filteredData.totalRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Pendente</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {filteredData.pendingRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {filteredData.totalExpenses.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${filteredData.netProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                }`}>
                <PiggyBank className={`w-6 h-6 ${filteredData.netProfit >= 0 ? 'text-success' : 'text-destructive'
                  }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${filteredData.netProfit >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                  R$ {filteredData.netProfit.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas do Período</CardTitle>
          <CardDescription>
            {filteredData.bookings.length} reservas em {months[parseInt(selectedMonth)]}/{selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(parseISO(booking.booking_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{getUserName(booking.user_id)}</TableCell>
                    <TableCell className="font-medium">
                      R$ {Number(booking.total_price).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma reserva encontrada neste período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas do Período</CardTitle>
          <CardDescription>
            {filteredData.expenses.length} despesas em {months[parseInt(selectedMonth)]}/{selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(parseISO(expense.expense_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="capitalize">{expense.category}</TableCell>
                    <TableCell className="font-medium text-destructive">
                      - R$ {Number(expense.amount).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma despesa encontrada neste período
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
