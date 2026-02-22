import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { LOYALTY_THRESHOLD, LOYALTY_DISCOUNT } from '@/lib/constants';
import { Gift, Star, Trophy, Sparkles } from 'lucide-react';

const LoyaltyProgram = () => {
  const { profile } = useAuth();

  const reservationCount = profile?.reservation_count || 0;
  const progress = Math.min((reservationCount / LOYALTY_THRESHOLD) * 100, 100);
  const remaining = Math.max(LOYALTY_THRESHOLD - reservationCount, 0);
  const hasDiscount = profile?.has_discount || false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Programa de Fidelidade
        </h1>
        <p className="text-muted-foreground mt-1">
          Ganhe recompensas por suas reservas
        </p>
      </div>

      {/* Main Progress Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-primary p-8 text-primary-foreground">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Seu Progresso</h2>
                <p className="text-primary-foreground/80 text-sm">
                  {reservationCount} de {LOYALTY_THRESHOLD} reservas
                </p>
              </div>
            </div>
            {hasDiscount && (
              <div className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-sm">20% OFF Ativo!</span>
              </div>
            )}
          </div>

          <Progress value={progress} className="h-4 bg-primary-foreground/20" />

          <div className="flex justify-between mt-3 text-sm text-primary-foreground/80">
            <span>0</span>
            <span>{LOYALTY_THRESHOLD} reservas</span>
          </div>
        </div>

        <CardContent className="p-6">
          {hasDiscount ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-10 h-10 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Parabéns! 🎉
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Você desbloqueou {LOYALTY_DISCOUNT * 100}% de desconto em sua próxima reserva.
                O desconto será aplicado automaticamente.
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {remaining === 0 ? 'Quase lá!' : `Faltam ${remaining} reservas`}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete {LOYALTY_THRESHOLD} reservas para ganhar um cupom de {LOYALTY_DISCOUNT * 100}% de
                desconto na sua próxima festa!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
          <CardDescription>
            Entenda como ganhar recompensas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-display font-bold text-primary text-xl">1</span>
              </div>
              <h4 className="font-semibold text-foreground mb-1">Faça Reservas</h4>
              <p className="text-sm text-muted-foreground">
                Cada reserva completada conta para o seu progresso
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-display font-bold text-primary text-xl">2</span>
              </div>
              <h4 className="font-semibold text-foreground mb-1">Acumule Pontos</h4>
              <p className="text-sm text-muted-foreground">
                Complete {LOYALTY_THRESHOLD} reservas para desbloquear a recompensa
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-display font-bold text-primary text-xl">3</span>
              </div>
              <h4 className="font-semibold text-foreground mb-1">Ganhe Desconto</h4>
              <p className="text-sm text-muted-foreground">
                Receba {LOYALTY_DISCOUNT * 100}% de desconto automaticamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyProgram;
