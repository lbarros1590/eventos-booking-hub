import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingSection = () => {
  const { settings, loading } = useVenueSettings();

  if (loading || !settings) {
    return (
      <section id="pricing" className="py-20 md:py-32 bg-secondary">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  const weekdayPrice = settings.global_discount_percent > 0 
    ? Math.round(settings.base_price_weekday * (1 - settings.global_discount_percent / 100))
    : settings.base_price_weekday;

  const weekendPrice = settings.global_discount_percent > 0
    ? Math.round(settings.base_price_weekend * (1 - settings.global_discount_percent / 100))
    : settings.base_price_weekend;

  const pricingPlans = [
    {
      title: 'Segunda a Quinta',
      price: weekdayPrice,
      originalPrice: settings.global_discount_percent > 0 ? settings.base_price_weekday : null,
      popular: false,
      features: [
        '12 horas de evento',
        'Piscina adulto e infantil',
        'Churrasqueira completa',
        'Toda estrutura inclusa',
        'Wi-Fi gratuito',
      ],
    },
    {
      title: 'Sexta a Domingo',
      price: weekendPrice,
      originalPrice: settings.global_discount_percent > 0 ? settings.base_price_weekend : null,
      popular: true,
      features: [
        '12 horas de evento',
        'Piscina adulto e infantil',
        'Churrasqueira completa',
        'Toda estrutura inclusa',
        'Wi-Fi gratuito',
        'Alta demanda - Reserve já!',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-32 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Valores
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Preços transparentes, sem surpresas
          </h2>
          <p className="text-muted-foreground text-lg">
            Valores acessíveis para você realizar o evento dos seus sonhos.
          </p>
          {settings.global_discount_percent > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full">
              <Sparkles size={16} />
              <span className="font-medium">Promoção: {settings.global_discount_percent}% de desconto!</span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'border-2 border-primary shadow-glow-primary'
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-accent text-accent-foreground text-xs font-semibold px-4 py-1 rounded-bl-xl flex items-center gap-1">
                    <Sparkles size={12} />
                    Mais Popular
                  </div>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-xl text-foreground">
                  {plan.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  {plan.originalPrice && (
                    <span className="text-2xl text-muted-foreground line-through mr-2">
                      R$ {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-5xl md:text-6xl font-display font-bold text-foreground">
                    R$ {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-1">/dia</span>
                </div>

                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a href="#availability">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary'
                        : 'bg-foreground hover:bg-foreground/90 text-background'
                    }`}
                    size="lg"
                  >
                    Reservar Este Dia
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cleaning Fee Notice */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3 bg-card rounded-full px-6 py-3 shadow-sm border border-border">
            <span className="text-muted-foreground">Taxa de limpeza:</span>
            <span className="font-semibold text-foreground">R$ {settings.cleaning_fee},00</span>
            <span className="text-muted-foreground text-sm">(obrigatória)</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
