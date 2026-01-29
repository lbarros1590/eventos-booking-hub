import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminCalendar from '@/components/admin/AdminCalendar';

const AdminCalendarPage = () => {
  const { user, role, loading } = useApp();
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
      <AdminCalendar />
    </AdminLayout>
  );
};

export default AdminCalendarPage;
