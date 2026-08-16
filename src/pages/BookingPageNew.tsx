import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Calendar, Star, Users, Car, Wifi, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
import { formatLocalDateInput, parseLocalDate, getRelativeDateLabel } from '@/lib/datetime';

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
  isAvailable?: boolean;
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
  const [isSlotUnavailable, setIsSlotUnavailable] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    receiptId: string;
    bookingId: string;
  } | null>(null);

  // Parse "YYYY-MM-DD" or generic Date strings
  const parseDateFromParam = (ds: string): Date | null => {
    return parseLocalDate(ds);
  };

  // Get URL parameters
  const slot = searchParams.get('slot');
  const date = searchParams.get('date');
  const sport = searchParams.get('sport');

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to continue with your booking.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    if (!venueId || !courtId || !slot || !date || !sport) {
      toast({
        title: "Invalid Booking Selection",
        description: "Missing booking parameters. Please choose your slot again.",
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
      const parsed = parseDateFromParam(date || '');
      if (!parsed) {
        throw new Error('Invalid date format');
      }
      const normalizedDate = formatLocalDateInput(parsed);

      const [facility, court] = await Promise.all([
        facilitiesApi.getById(venueId!),
        courtsApi.getById(courtId!)
      ]);

      // Determine start/end/price and check live availability
      let startTimeNorm = '09:00';
      let endTimeNorm = '10:00';
      let duration = 1;
      let price = Number(court.pricePerHour);
      let isAvailable = true;

      try {
        const slots = await facilitiesApi.getAvailability(venueId!, normalizedDate);
        const selected = Array.isArray(slots) ? slots.find((s: any) => s.id === slot) : null;
        if (selected) {
          startTimeNorm = selected.startTime;
          endTimeNorm = selected.endTime;
          isAvailable = selected.isAvailable;
          const [sh, sm] = selected.startTime.split(':').map(Number);
          const [eh, em] = selected.endTime.split(':').map(Number);
          duration = Math.max(0.5, ((eh * 60 + (em || 0)) - (sh * 60 + (sm || 0))) / 60);
          price = Math.round(Number(selected.price) * duration);
        }
      } catch (e) {
        console.warn('Availability lookup warning, using court defaults:', e);
      }

      setIsSlotUnavailable(!isAvailable);

      const bookingData: BookingDetails = {
        id: '',
        facilityId: facility.id,
        facilityName: facility.name,
        courtId: court.id,
        courtName: court.name,
        location: facility.location,
        sport: sport || 'Sport',
        date: normalizedDate,
        startTime: startTimeNorm,
        endTime: endTimeNorm,
        price,
        duration,
        facilityImage: facility.images?.[0] || '/placeholder.svg',
        amenities: facility.amenities || [],
        rating: facility.rating || undefined,
        isAvailable,
      };

      setBookingDetails(bookingData);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive",
      });
      navigate(venueId ? `/venue-details/${venueId}` : '/venues');
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async () => {
    if (!bookingDetails) return;

    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please log in to make a booking.",
        variant: "destructive",
      });
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    if (isSlotUnavailable) {
      toast({
        title: "Slot Unavailable",
        description: "This court slot has already been booked. Please pick another slot.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingBooking(true);

      // Construct standard UTC ISO timestamps
      const startIso = `${bookingDetails.date}T${bookingDetails.startTime}:00.000Z`;
      const endIso = `${bookingDetails.date}T${bookingDetails.endTime}:00.000Z`;

      const data = await bookingsApi.create({
        courtId: bookingDetails.courtId,
        startTime: startIso,
        endTime: endIso,
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
        title: "Slot Reserved by Someone Else",
        description: error.message || "Failed to create booking. Please choose another slot.",
        variant: "destructive",
      });
      setIsSlotUnavailable(true);
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
    const d = parseLocalDate(dateString);
    if (!d) return dateString;
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    try {
      const [h, m] = timeString.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m || '00'} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <BrandNav />
        <div className="pt-28 pb-16 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="font-semibold text-slate-800">Verifying Court Availability...</p>
            <p className="text-xs text-slate-500 mt-1">Preparing your reservation</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <BrandNav />
        <div className="pt-28 pb-16 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm">
            <p className="font-semibold text-slate-800">Booking details not found.</p>
            <Button onClick={() => navigate('/venues')} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              Back to Venues
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
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
              onClick={() => navigate(venueId ? `/venue-details/${venueId}` : -1 as any)}
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex-shrink-0 rounded-xl shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Checkout Reservation</h1>
              <p className="text-xs sm:text-sm text-slate-500">Review your schedule and confirm reservation</p>
            </div>
          </div>

          {/* Slot Unavailable Warning Banner */}
          {isSlotUnavailable && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-red-900">Slot Already Booked</h4>
                <p className="text-xs text-red-700 mt-0.5">
                  This court time slot has already been reserved by another player. Please return to the venue page and select another available slot.
                </p>
                <Button
                  onClick={() => navigate(`/venue-details/${venueId}`)}
                  size="sm"
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-lg"
                >
                  Choose Another Slot
                </Button>
              </div>
            </div>
          )}

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6 border-slate-200 bg-white text-slate-900 shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden border border-slate-200">
                    <img 
                      src={bookingDetails.facilityImage} 
                      alt={bookingDetails.facilityName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 truncate">{bookingDetails.facilityName}</CardTitle>
                        <p className="text-xs sm:text-sm font-semibold text-emerald-700 truncate">{bookingDetails.courtName}</p>
                        {bookingDetails.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-slate-700">{bookingDetails.rating}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="border-emerald-300 bg-emerald-100/60 text-emerald-800 text-xs font-semibold flex-shrink-0">
                        {bookingDetails.sport}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate font-medium">{bookingDetails.location}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">{formatDate(bookingDetails.date)}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">
                      {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      ({bookingDetails.duration} hr{bookingDetails.duration > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                {bookingDetails.amenities && bookingDetails.amenities.length > 0 && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Venue Amenities</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {bookingDetails.amenities.slice(0, 6).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 text-[11px]">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="bg-slate-100" />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Price Breakdown</h4>
                  <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rate per hour</span>
                      <span className="font-medium text-slate-800">₹{(bookingDetails.price / (bookingDetails.duration || 1)).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-medium text-slate-800">{bookingDetails.duration} Hour{bookingDetails.duration > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST & Service Taxes</span>
                      <span className="text-emerald-700 font-semibold">₹0 (Included)</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm sm:text-base pt-2 border-t border-slate-200 text-slate-900">
                      <span>Total Amount Payable</span>
                      <span className="text-emerald-600 font-extrabold text-base sm:text-lg">₹{bookingDetails.price}</span>
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
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button
              onClick={createBooking}
              disabled={isCreatingBooking || isSlotUnavailable}
              className={`w-full h-12 sm:h-14 text-sm sm:text-base font-extrabold rounded-xl shadow-lg transition-all ${
                isSlotUnavailable
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
              size="lg"
            >
              {isCreatingBooking ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Locking Slot...
                </>
              ) : isSlotUnavailable ? (
                <>Slot Unavailable</>
              ) : !isAuthenticated ? (
                <>Login to Book - ₹{bookingDetails.price}</>
              ) : (
                <>Proceed to Payment • ₹{bookingDetails.price}</>
              )}
            </Button>
          </motion.div>

          {/* Guarantee Footer */}
          <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>100% Instant Slot Guarantee. Subject to venue cancellation policy.</span>
          </div>
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
