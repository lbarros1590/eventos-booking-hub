import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminFinancial from '@/components/admin/AdminFinancial';

const AdminFinancialPage = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, role, loading, navigate]);

  if (loading || !user || role !== 'admin') return null;

  return (
    <AdminLayout>
      <AdminFinancial />
    </AdminLayout>
  );
};

export default AdminFinancialPage;
