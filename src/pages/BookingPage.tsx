import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandNav from '@/components/BrandNav';
import BookingFormCard from '@/components/BookingFormCard';
import AuthGuard from '@/components/AuthGuard';
import SEO from '@/components/SEO';
import { facilitiesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface VenueSummary {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  image: string;
}

export interface BookingData {
  venueId: string;
  sport: string;
  date: string;
  startTime: string;
  duration: number;
  court: string;
  price: number;
}

const BookingPage = () => {
  const { venueId, courtId } = useParams<{ venueId: string; courtId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extract pre-selected values from URL params
  const preSelectedSport = searchParams.get('sport') || '';
  const preSelectedDate = searchParams.get('date') || '';
  const preSelectedTime = searchParams.get('time') || '';

  // State
  const [venue, setVenue] = useState<VenueSummary | null>(null);
  const [isLoadingVenue, setIsLoadingVenue] = useState(true);

  // Mock venue data for development
  const mockVenue: VenueSummary = {
    id: venueId || 'venue1',
    name: 'SBR Badminton',
    location: 'Satellite, Jodhpur Village',
    rating: 4.9,
    reviewCount: 6,
    image: '/placeholder.svg'
  };

  useEffect(() => {
    if (venueId) {
      fetchVenueDetails();
    }
  }, [venueId]);

  const fetchVenueDetails = async () => {
    try {
      setIsLoadingVenue(true);
      // TODO: Replace with actual API call
      // const response = await facilitiesApi.getVenueDetails(venueId);
      // setVenue(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        setVenue(mockVenue);
        setIsLoadingVenue(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching venue details:', error);
      toast({
        title: "Error",
        description: "Failed to load venue details. Please try again.",
        variant: "destructive"
      });
      setIsLoadingVenue(false);
    }
  };

  const handleBookingComplete = async (bookingData: BookingData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await facilitiesApi.createBooking(bookingData);
      // const { transactionId } = response.data;
      
      // Mock successful booking
      const mockTransactionId = 'TXN' + Date.now();
      
      toast({
        title: "Booking Created Successfully!",
        description: `Transaction ID: ${mockTransactionId}`,
      });

      // Redirect to payment or confirmation page
      navigate(`/payment/${mockTransactionId}`, {
        state: { bookingData, venue }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: "Unable to create booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGoBack = () => {
    if (venueId) {
      navigate(`/venue-details/${venueId}`);
    } else {
      navigate('/book');
    }
  };

  if (isLoadingVenue) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-green-50">
          <SEO
            title="Court Booking - QuickCourt"
            description="Book your sports court with QuickCourt"
          />
          <BrandNav />
          
          <div className="pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
              {/* Loading State */}
              <div className="text-center mb-8">
                <div className="h-8 bg-gray-200 rounded-lg w-48 mx-auto mb-4 animate-pulse"></div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!venue) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-green-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
            <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist.</p>
            <Button onClick={handleGoBack} className="bg-green-600 hover:bg-green-700">
              Go Back
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-green-50">
        <SEO
          title={`Book ${venue.name} - QuickCourt`}
          description={`Book courts at ${venue.name} in ${venue.location}. Quick and easy booking process.`}
        />
        
        <BrandNav />
        
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="text-green-600 hover:text-green-700 hover:bg-green-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Venue Details
              </Button>
            </motion.div>

            {/* Page Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold text-gray-900">Court Booking</h1>
              <p className="text-gray-600 mt-2">
                Complete your booking details below
              </p>
            </motion.div>

            {/* Booking Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <BookingFormCard
                venue={venue}
                preSelectedSport={preSelectedSport}
                preSelectedDate={preSelectedDate}
                preSelectedTime={preSelectedTime}
                preSelectedCourt={courtId}
                onBookingComplete={handleBookingComplete}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default BookingPage;
