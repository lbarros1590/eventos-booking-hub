import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BUSINESS_INFO } from '@/lib/constants';
import { MapPin, Phone, Navigation } from 'lucide-react';

const LocationSection = () => {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS_INFO.address)}`;

  return (
    <section id="location" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Localização
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Fácil de encontrar
          </h2>
          <p className="text-muted-foreground text-lg">
            Localizado no bairro Serra Dourada, em Cuiabá - MT
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Map Placeholder */}
          <Card className="overflow-hidden border-border">
            <div className="aspect-video bg-muted relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3842.0123456789!2d-56.123456!3d-15.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTXCsDA3JzI0LjQiUyA1NsKwMDcnMjQuNCJX!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Serra Dourada, Cuiabá - MT
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Info */}
          <div className="flex flex-col justify-center space-y-6">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Endereço</h3>
                    <p className="text-muted-foreground">{BUSINESS_INFO.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Telefones</h3>
                    <p className="text-muted-foreground">{BUSINESS_INFO.phones[0]}</p>
                    <p className="text-muted-foreground">
                      {BUSINESS_INFO.phones[1]} ({BUSINESS_INFO.contactPerson})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary"
              >
                <Navigation className="mr-2" size={20} />
                Abrir no Google Maps
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
