import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import BrandNav from '@/components/BrandNav';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';

const BookingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Book Court - QuickCourt" description="Complete your court booking" />
      <BrandNav />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Booking Feature Coming Soon</h2>
            <p className="text-gray-600 mb-4">
              The booking functionality is currently being developed. Please check back later.
            </p>
                        <Button onClick={() => navigate('/book')}>
              Back to Venues
              Browse Venues
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
