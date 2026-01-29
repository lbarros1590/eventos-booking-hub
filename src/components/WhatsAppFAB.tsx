import { BUSINESS_INFO } from '@/lib/constants';
import { MessageCircle } from 'lucide-react';

const WhatsAppFAB = () => {
  const whatsappUrl = `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(BUSINESS_INFO.whatsappMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] hover:bg-[#20BA5C] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group animate-float"
      aria-label="Fale conosco pelo WhatsApp"
    >
      <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" fill="white" />
      <span className="absolute right-full mr-3 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
        Fale conosco
      </span>
    </a>
  );
};

export default WhatsAppFAB;
