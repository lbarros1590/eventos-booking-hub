import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BUSINESS_INFO } from '@/lib/constants';
import { Menu, X, Instagram, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">EJ</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground hidden sm:block">
              {BUSINESS_INFO.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#amenities" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Estrutura
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Valores
            </a>
            <a href="#location" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Localização
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Contato
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                  <Button variant="ghost" size="sm">
                    Painel
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary">
                    Criar Conta
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-3">
              <a
                href="#amenities"
                className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Estrutura
              </a>
              <a
                href="#pricing"
                className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Valores
              </a>
              <a
                href="#location"
                className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Localização
              </a>
              <a
                href="#contact"
                className="px-4 py-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </a>
              <div className="flex gap-2 px-4 pt-3 border-t border-border mt-2">
                {user ? (
                  <>
                    <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        Painel
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={logout} className="flex-1">
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button className="w-full bg-gradient-primary text-primary-foreground" size="sm">
                        Criar Conta
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
