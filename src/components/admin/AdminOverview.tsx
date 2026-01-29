import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign,
  TrendingUp,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const AdminOverview = () => {
  const { bookings, expenses } = useApp();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate revenue this month
  const monthlyBookings = bookings.filter((b) => {
    const bookingMonth = b.date.getMonth();
    const bookingYear = b.date.getFullYear();
    return bookingMonth === currentMonth && bookingYear === currentYear && b.status !== 'cancelled';
  });

  const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Pending payments (pending bookings)
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const pendingAmount = pendingBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Next event
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingBookings = bookings
    .filter((b) => b.date >= today && b.status !== 'cancelled')
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextEvent = upcomingBookings[0];

  // Monthly expenses
  const monthlyExpenses = expenses
    .filter((e) => {
      const expenseMonth = e.date.getMonth();
      const expenseYear = e.date.getFullYear();
      return expenseMonth === currentMonth && expenseYear === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const profit = monthlyRevenue - monthlyExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Visão Geral
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumo do seu negócio este mês
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  R$ {monthlyRevenue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  R$ {pendingAmount.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingBookings.length} reserva(s)
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximo Evento</p>
                {nextEvent ? (
                  <>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {format(nextEvent.date, 'dd/MM', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {nextEvent.userName}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-medium text-muted-foreground mt-1">
                    Nenhum agendado
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro do Mês</p>
                <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {profit.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <TrendingUp className={`w-6 h-6 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reservas Recentes</CardTitle>
            <CardDescription>Últimas reservas realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-success' :
                      booking.status === 'pending' ? 'bg-warning' :
                      booking.status === 'completed' ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {booking.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(booking.date, "dd 'de' MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground text-sm">
                    R$ {booking.totalPrice}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Eventos agendados para os próximos dias</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum evento próximo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {booking.status === 'confirmed' ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-warning" />
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {format(booking.date, "EEEE, dd/MM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.userName} • {booking.userPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
