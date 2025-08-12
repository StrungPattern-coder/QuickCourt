import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Calendar, Star, Users, Car, Wifi, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BrandNav from '@/components/BrandNav';
import PaymentModal from '@/components/PaymentModal';
import BookingSuccess from '@/components/BookingSuccess';
import SEO from '@/components/SEO';

const API_BASE_URL = 'http://localhost:4000';

interface BookingDetails {
  id: string;
  facilityId: string;
  facilityName: string;
  courtId: string;
  courtName: string;
  location: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  duration: number;
  facilityImage?: string;
  amenities?: string[];
  rating?: number;
}

const BookingPageNew: React.FC = () => {
  const { venueId, courtId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    paymentId: string;
    bookingId: string;
  } | null>(null);

  // Get URL parameters
  const slot = searchParams.get('slot');
  const date = searchParams.get('date');
  const sport = searchParams.get('sport');

  useEffect(() => {
    console.log('=== BOOKING PAGE DEBUG ===');
    console.log('venueId:', venueId);
    console.log('courtId:', courtId);
    console.log('slot:', slot);
    console.log('date:', date);
    console.log('sport:', sport);
    console.log('isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to continue with your booking.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

  if (!venueId || !courtId || !slot || !date || !sport) {
      console.log('Missing parameters check:');
      console.log('- venueId missing:', !venueId);
      console.log('- courtId missing:', !courtId);
      console.log('- slot missing:', !slot);
      console.log('- date missing:', !date);
      console.log('- sport missing:', !sport);
      
      toast({
        title: "Invalid Booking",
        description: "Missing booking parameters. Please start over.",
        variant: "destructive",
      });
      if (venueId) {
        navigate(`/venue-details/${venueId}`);
      } else {
        navigate('/play');
      }
      return;
    }

    fetchBookingDetails();
  }, [venueId, courtId, slot, date, sport, isAuthenticated]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);

      // Fetch venue/facility details
      const facilityResponse = await fetch(`${API_BASE_URL}/facilities/${venueId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!facilityResponse.ok) {
        throw new Error('Failed to fetch facility details');
      }

      const facility = await facilityResponse.json();

      // Fetch court details
      const courtResponse = await fetch(`${API_BASE_URL}/courts/${courtId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!courtResponse.ok) {
        throw new Error('Failed to fetch court details');
      }

      const court = await courtResponse.json();

      // Parse time slot (assuming format like "09:00-10:00")
      const [startTime, endTime] = (slot || '').split('-');
      const startHour = parseInt(startTime?.split(':')[0] || '9');
      const endHour = parseInt(endTime?.split(':')[0] || '10');
      const duration = endHour - startHour;
      const price = duration * Number(court.pricePerHour);

      const bookingData: BookingDetails = {
        id: '', // Will be set after booking creation
        facilityId: facility.id,
        facilityName: facility.name,
        courtId: court.id,
        courtName: court.name,
        location: facility.location,
        sport: sport || 'Unknown',
        date: date || '',
        startTime: startTime || '09:00',
        endTime: endTime || '10:00',
        price: price,
        duration: duration,
        facilityImage: facility.images?.[0] || '/placeholder.svg',
        amenities: facility.amenities || [],
        rating: 4.5, // Mock rating, replace with actual data
      };

      setBookingDetails(bookingData);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive",
      });
      navigate('/venues');
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async () => {
    if (!bookingDetails) return;

    try {
      setIsCreatingBooking(true);

      // Create booking date-time strings
      const bookingDate = new Date(bookingDetails.date);
      const [startHour, startMin] = bookingDetails.startTime.split(':').map(Number);
      const [endHour, endMin] = bookingDetails.endTime.split(':').map(Number);

      const startDateTime = new Date(bookingDate);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(bookingDate);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          courtId: bookingDetails.courtId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      // Update booking details with the created booking ID
      setBookingDetails(prev => prev ? { ...prev, id: data.data.booking.id } : null);

      // Show payment modal
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string, bookingId: string) => {
    setPaymentData({ paymentId, bookingId });
    setShowPaymentModal(false);
    setShowSuccessModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BrandNav />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p>Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BrandNav />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <p>Booking details not found.</p>
            <Button onClick={() => navigate('/venues')} className="mt-4">
              Back to Venues
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={`Book ${bookingDetails.facilityName} - QuickCourt`}
        description={`Complete your booking for ${bookingDetails.courtName} at ${bookingDetails.facilityName}`}
      />
      
      <BrandNav />
      
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Complete Booking</h1>
              <p className="text-gray-600">Review details and confirm your reservation</p>
            </div>
          </div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <img 
                      src={bookingDetails.facilityImage} 
                      alt={bookingDetails.facilityName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{bookingDetails.facilityName}</CardTitle>
                        <p className="text-sm text-gray-600">{bookingDetails.courtName}</p>
                        {bookingDetails.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{bookingDetails.rating}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {bookingDetails.sport}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{bookingDetails.location}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(bookingDetails.date)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                {bookingDetails.amenities && bookingDetails.amenities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {bookingDetails.amenities.slice(0, 6).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-medium">Price Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Court rental rate</span>
                      <span>₹{(bookingDetails.price / bookingDetails.duration).toFixed(0)}/hour</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span>{bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1 border-t">
                      <span>Total Amount</span>
                      <span className="text-green-600">₹{bookingDetails.price}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              onClick={createBooking}
              disabled={isCreatingBooking}
              className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isCreatingBooking ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                <>
                  Proceed to Payment - ₹{bookingDetails.price}
                </>
              )}
            </Button>
          </motion.div>

          {/* Terms */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-center text-xs text-gray-500"
          >
            <p>
              By proceeding, you agree to our Terms of Service and Privacy Policy.
              Cancellations are subject to the facility's cancellation policy.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && bookingDetails && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          bookingData={bookingDetails}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && paymentData && bookingDetails && (
        <BookingSuccess
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/my-bookings');
          }}
          bookingData={{
            ...bookingDetails,
            paymentId: paymentData.paymentId,
          }}
        />
      )}
    </div>
  );
};

export default BookingPageNew;
