import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LoyaltyProgram from '@/components/dashboard/LoyaltyProgram';

const Loyalty = () => {
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
      <LoyaltyProgram />
    </DashboardLayout>
  );
};

export default Loyalty;
