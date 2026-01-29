import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MyReservations from '@/components/dashboard/MyReservations';

const Reservations = () => {
  const { user, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <MyReservations />
    </DashboardLayout>
  );
};

export default Reservations;
