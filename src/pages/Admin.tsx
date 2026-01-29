import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/components/admin/AdminOverview';

const Admin = () => {
  const { user, role, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-accent flex items-center justify-center mb-4 animate-pulse">
            <span className="text-accent-foreground font-display font-bold text-2xl">EJ</span>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== 'admin') return null;

  return (
    <AdminLayout>
      <AdminOverview />
    </AdminLayout>
  );
};

export default Admin;
