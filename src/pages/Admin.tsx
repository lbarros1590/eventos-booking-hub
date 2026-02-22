import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/components/admin/AdminOverview';

const Admin = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`[ADMIN_PAGE] State:`, { loading, hasUser: !!user, role });
    if (!loading && !user) {
      console.log(`[ADMIN_PAGE] Redirecting to login`);
      navigate('/login');
    } else if (!loading && role !== 'admin') {
      console.log(`[ADMIN_PAGE] Redirecting to dashboard (role: ${role})`);
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
