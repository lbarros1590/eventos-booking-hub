import { Link } from 'react-router-dom';
import { BUSINESS_INFO } from '@/lib/constants';
import { Instagram, Phone, MapPin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">EJ</span>
              </div>
              <span className="font-display font-bold text-xl">{BUSINESS_INFO.name}</span>
            </div>
            <p className="text-background/70 leading-relaxed">
              O espaço perfeito para realizar seus eventos e criar memórias inesquecíveis com quem você ama.
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg">Contato</h3>
            <div className="space-y-3">
              <a
                href={`tel:+55${BUSINESS_INFO.phones[0].replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-background/70 hover:text-primary transition-colors"
              >
                <Phone size={18} />
                <span>{BUSINESS_INFO.phones[0]}</span>
              </a>
              <a
                href={`tel:+55${BUSINESS_INFO.phones[1].replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-background/70 hover:text-primary transition-colors"
              >
                <Phone size={18} />
                <span>{BUSINESS_INFO.phones[1]} ({BUSINESS_INFO.contactPerson})</span>
              </a>
              <a
                href={`https://instagram.com/${BUSINESS_INFO.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-background/70 hover:text-primary transition-colors"
              >
                <Instagram size={18} />
                <span>{BUSINESS_INFO.instagram}</span>
              </a>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg">Localização</h3>
            <div className="flex items-start gap-3 text-background/70">
              <MapPin size={18} className="mt-1 flex-shrink-0" />
              <span>{BUSINESS_INFO.address}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-background/50 text-sm">
          <p>© {new Date().getFullYear()} {BUSINESS_INFO.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
