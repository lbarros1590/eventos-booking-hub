import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import NewReservation from '@/components/dashboard/NewReservation';

const Dashboard = () => {
  const { user, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 animate-pulse">
            <span className="text-primary-foreground font-display font-bold text-2xl">EJ</span>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <NewReservation />
    </DashboardLayout>
  );
};

export default Dashboard;
