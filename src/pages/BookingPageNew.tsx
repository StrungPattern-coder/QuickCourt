import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Calendar, Star, Users, Car, Wifi, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BrandNav from '@/components/BrandNav';
import BookingSuccess from '@/components/BookingSuccess';
import PaymentModal from '@/components/PaymentModal';
import SEO from '@/components/SEO';
import { bookingsApi, courtsApi, facilitiesApi } from '@/lib/api';

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
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    receiptId: string;
    bookingId: string;
  } | null>(null);

  // Robust date parsing for "YYYY-MM-DD" and "DD-MM-YYYY" and generic Date strings
  const parseDateFromParam = (ds: string): Date | null => {
    if (!ds) return null;
    // ISO date (YYYY-MM-DD)
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (iso.test(ds)) {
      const [y, m, d] = ds.split('-').map(Number);
      return new Date(y, (m as number) - 1, d);
    }
    // Common DD-MM-YYYY
    const dmy = /^\d{2}-\d{2}-\d{4}$/;
    if (dmy.test(ds)) {
      const [d, m, y] = ds.split('-').map(Number);
      return new Date(y, (m as number) - 1, d);
    }
    const dt = new Date(ds);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

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
      // Parse and normalize date first
      const parsed = parseDateFromParam(date || '');
      if (!parsed) {
        throw new Error('Invalid date');
      }
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      const normalizedDate = `${y}-${m}-${d}`; // store as YYYY-MM-DD

      const [facility, court] = await Promise.all([
        facilitiesApi.getById(venueId!),
        courtsApi.getById(courtId!)
      ]);

      // Revalidate the slot on the server before showing checkout.  Do not
      // fall back to a default time: that could create a booking for a
      // different slot after the selected one has become unavailable.
      const slots = await facilitiesApi.getAvailability(venueId!, normalizedDate);
      const selected = Array.isArray(slots) ? slots.find((s: any) => s.id === slot) : null;
      if (!selected || !selected.isAvailable || selected.courtId !== court.id) {
        toast({
          title: 'Slot no longer available',
          description: 'The selected time has just been booked. Please choose another slot.',
          variant: 'destructive',
        });
        navigate(`/venue-details/${venueId}`, { replace: true });
        return;
      }

      const startTimeNorm = selected.startTime;
      const endTimeNorm = selected.endTime;
      const duration = Math.max(0.5, (
        Number(selected.endTime.split(':')[0]) * 60 + Number(selected.endTime.split(':')[1] || 0) -
        (Number(selected.startTime.split(':')[0]) * 60 + Number(selected.startTime.split(':')[1] || 0))
      ) / 60);
      const price = Number(selected.price) * duration;

      const bookingData: BookingDetails = {
        id: '', // Will be set after booking creation
        facilityId: facility.id,
        facilityName: facility.name,
        courtId: court.id,
        courtName: court.name,
        location: facility.location,
        sport: sport || 'Unknown',
  date: normalizedDate,
  startTime: startTimeNorm,
  endTime: endTimeNorm,
  price,
  duration,
        facilityImage: facility.images?.[0] || '/placeholder.svg',
        amenities: facility.amenities || [],
        rating: facility.rating || undefined,
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

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please log in to make a booking.",
        variant: "destructive",
      });
      // Redirect to login with return URL
      navigate('/login', { 
        state: { from: location.pathname + location.search } 
      });
      return;
    }

    try {
      setIsCreatingBooking(true);

      // Create booking date-time strings
      // Slots are displayed in the venue's (India) timezone.  Include the
      // offset explicitly so the instant sent to the API is identical from
      // every browser timezone.
      const startDateTime = new Date(`${bookingDetails.date}T${bookingDetails.startTime}:00+05:30`);
      const endDateTime = new Date(`${bookingDetails.date}T${bookingDetails.endTime}:00+05:30`);
      if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date format. Please go back and reselect your date.');
      }

      const data = await bookingsApi.create({
        courtId: bookingDetails.courtId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      const createdBookingId = data.id;
      setBookingDetails(prev => prev ? { ...prev, id: createdBookingId } : null);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Failed to create booking:', error);

      if (String(error?.message || '').toLowerCase().includes('slot unavailable')) {
        // Return to freshly fetched availability, where the time is visibly
        // marked BOOKED and cannot be selected again.
        setShowPaymentModal(false);
        navigate(`/venue-details/${venueId}`, { replace: true });
        return;
      }

      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleReceiptGenerated = (receiptId: string, bookingId: string) => {
    setReceiptData({ receiptId, bookingId });
    setShowSuccessModal(true);
  };

  const handlePaymentSuccess = (paymentId: string, bookingId: string) => {
    setShowPaymentModal(false);
    handleReceiptGenerated(`RZP-${paymentId}`, bookingId);
  };

  const handlePaymentClose = async () => {
    const pendingBookingId = bookingDetails?.id;
    setShowPaymentModal(false);

    if (!pendingBookingId) return;

    try {
      await bookingsApi.delete(pendingBookingId);
      setBookingDetails(prev => prev ? { ...prev, id: '' } : null);
    } catch (error) {
      console.warn('Failed to release pending booking after payment dismissal', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseDateFromParam(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('en-IN', {
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
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      <SEO 
        title={`Book ${bookingDetails.facilityName} - QuickCourt`}
        description={`Complete your booking for ${bookingDetails.courtName} at ${bookingDetails.facilityName}`}
      />
      
      <BrandNav />
      
      <div className="pt-24 pb-12 flex-1">
        <div className="container mx-auto px-4 max-w-xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white flex-shrink-0 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Checkout Reservation</h1>
              <p className="text-xs sm:text-sm text-slate-400">Review schedule and lock in your court slot</p>
            </div>
          </div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-6 border-slate-800 bg-slate-900/90 text-white shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-xl flex-shrink-0 overflow-hidden border border-slate-700">
                    <img 
                      src={bookingDetails.facilityImage} 
                      alt={bookingDetails.facilityName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <CardTitle className="text-base sm:text-lg font-bold text-white truncate">{bookingDetails.facilityName}</CardTitle>
                        <p className="text-xs sm:text-sm font-semibold text-emerald-400 truncate">{bookingDetails.courtName}</p>
                        {bookingDetails.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-slate-200">{bookingDetails.rating}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex-shrink-0">
                        {bookingDetails.sport}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{bookingDetails.location}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Calendar className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>{formatDate(bookingDetails.date)}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-300">
                    <Clock className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({bookingDetails.duration} hr{bookingDetails.duration > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                {bookingDetails.amenities && bookingDetails.amenities.length > 0 && (
                  <>
                    <Separator className="bg-slate-800" />
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Facility Amenities</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {bookingDetails.amenities.slice(0, 6).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="border-slate-800 bg-slate-950/60 text-slate-300 text-[11px]">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="bg-slate-800" />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price Breakdown</h4>
                  <div className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rate per hour</span>
                      <span>₹{(bookingDetails.price / bookingDetails.duration).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Slot Duration</span>
                      <span>{bookingDetails.duration} Hour{bookingDetails.duration > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm sm:text-base pt-2 border-t border-slate-800 text-white">
                      <span>Total Booking Price</span>
                      <span className="text-emerald-400 font-extrabold text-base sm:text-lg">₹{bookingDetails.price}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Button
              onClick={createBooking}
              disabled={isCreatingBooking}
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
              size="lg"
            >
              {isCreatingBooking ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Locking Slot...
                </>
              ) : !isAuthenticated ? (
                <>
                  Login to Book - ₹{bookingDetails.price}
                </>
              ) : (
                <>
                  Proceed to Payment • ₹{bookingDetails.price}
                </>
              )}
            </Button>
          </motion.div>

          {/* Terms */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-4 text-center text-[11px] text-slate-500"
          >
            <p>
              🔒 100% Instant Slot Guarantee. Subject to venue rules and cancellation policies.
            </p>
          </motion.div>
        </div>
      </div>

      {showPaymentModal && bookingDetails.id && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          bookingData={bookingDetails}
        />
      )}

      {/* Success Modal */}
  {showSuccessModal && receiptData && bookingDetails && (
        <BookingSuccess
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/my-bookings');
          }}
          bookingData={{
            ...bookingDetails,
    receiptId: receiptData.receiptId,
          }}
        />
      )}
    </div>
  );
};

export default BookingPageNew;
