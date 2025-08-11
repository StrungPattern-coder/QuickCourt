import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import HomePage from './HomePage';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect owners to their dashboard instead of showing the regular homepage
    if (isAuthenticated && user?.role === 'OWNER') {
      navigate('/owner-dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  // Show homepage for non-owners or non-authenticated users
  if (!isAuthenticated || user?.role !== 'OWNER') {
    return <HomePage />;
  }

  // Return null while redirecting
  return null;
};

export default Index;
