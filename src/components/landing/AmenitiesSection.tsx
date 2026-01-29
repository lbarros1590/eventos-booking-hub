import { Card, CardContent } from '@/components/ui/card';
import { AMENITIES } from '@/lib/constants';
import { getIcon } from '@/lib/icons';

const AmenitiesSection = () => {
  return (
    <section id="amenities" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Estrutura Completa
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tudo o que você precisa para seu evento
          </h2>
          <p className="text-muted-foreground text-lg">
            Nosso espaço oferece infraestrutura completa para festas de até 50 pessoas, com conforto e qualidade.
          </p>
        </div>

        {/* Amenities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {AMENITIES.map((amenity, index) => {
            const Icon = getIcon(amenity.icon);
            return (
              <Card
                key={amenity.id}
                className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-medium text-foreground text-sm leading-tight">
                    {amenity.name}
                  </h3>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-gradient-primary rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
          <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Duração da Festa: 12 Horas
          </h3>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Aproveite seu evento sem pressa. Você terá 12 horas completas para celebrar com sua família e amigos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AmenitiesSection;
