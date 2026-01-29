import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Clock, Users, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import heroImage from '@/assets/hero-pool.jpg';
import { cn } from '@/lib/utils';

const HeroGallery = () => {
  const { settings } = useVenueSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  
  const galleryItems = settings?.gallery_urls?.length 
    ? settings.gallery_urls 
    : [heroImage];

  const isVideo = (url: string) => {
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  };

  useEffect(() => {
    if (!isPlaying || galleryItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, galleryItems.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0">
        {galleryItems.map((item, index) => (
          <div
            key={item}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              index === currentIndex ? "opacity-100" : "opacity-0"
            )}
          >
            {isVideo(item) ? (
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={item}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={item}
                alt={`EJ Eventos - Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Navigation Controls */}
      {galleryItems.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            {galleryItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex 
                    ? "w-8 bg-white" 
                    : "bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="ml-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-20">
        <div className="max-w-4xl mx-auto animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground px-4 py-2 rounded-full mb-8">
            <Star size={16} className="text-accent" fill="currentColor" />
            <span className="text-sm font-medium">Espaço mais reservado da região</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Seu evento{' '}
            <span className="text-accent">inesquecível</span>
            <br />
            começa aqui
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Espaço completo com piscinas, churrasqueira e toda estrutura para festas e confraternizações em Cuiabá.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a href="#availability">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-accent hover:opacity-90 text-accent-foreground shadow-accent text-lg px-8 py-6 h-auto font-semibold group"
              >
                Ver Disponibilidade
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <a href="#amenities">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 h-auto"
              >
                Ver Estrutura
              </Button>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-3 text-primary-foreground/80">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-primary-foreground">12 Horas</p>
                <p className="text-sm">de festa</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/80">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-primary-foreground">+50</p>
                <p className="text-sm">eventos realizados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/80">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-primary-foreground">5.0</p>
                <p className="text-sm">avaliação média</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroGallery;
