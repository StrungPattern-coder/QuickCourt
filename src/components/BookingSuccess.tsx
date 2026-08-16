import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Clock, MapPin, Download, Share2, ArrowRight, FileText, Sparkles, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate } from '@/lib/datetime';
import { generateInvoicePDF } from '@/lib/invoice';
import { useAuth } from '@/contexts/AuthContext';

interface BookingSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    id: string;
    receiptId: string;
    facilityName: string;
    courtName: string;
    location: string;
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
  };
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({
  isOpen,
  onClose,
  bookingData,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const formatDate = (dateString: string) => {
    try {
      const d = parseLocalDate(dateString) || new Date(dateString);
      if (Number.isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
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

  const handleShare = async () => {
    const bookingText = `🎾 Booking Confirmed at ${bookingData.facilityName}!\n\n📍 ${bookingData.location}\n🏟️ ${bookingData.courtName}\n📅 ${formatDate(bookingData.date)}\n🕐 ${formatTime(bookingData.startTime)} - ${formatTime(bookingData.endTime)}\n💰 ₹${bookingData.price}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QuickCourt Booking Confirmed',
          text: bookingText,
        });
      } catch {
        console.log('Share dismissed');
      }
    } else {
      await navigator.clipboard.writeText(bookingText);
      toast({
        title: "Copied to clipboard",
        description: "Booking details copied to clipboard!",
      });
    }
  };

  const handleDownloadReceipt = () => {
    try {
      generateInvoicePDF({
        ...bookingData,
        userName: user?.fullName,
        userEmail: user?.email,
      });
      toast({
        title: "Tax Invoice Downloaded",
        description: "Official PDF Tax Invoice downloaded successfully.",
      });
    } catch (error) {
      console.error('Invoice download failed', error);
      toast({
        title: "Download Failed",
        description: "Unable to generate invoice PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewBookings = () => {
    onClose();
    navigate('/my-bookings');
  };

  const handleBookAnother = () => {
    onClose();
    navigate('/venues');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[92vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <DialogHeader className="sr-only">
          <DialogTitle>Booking Confirmed</DialogTitle>
          <DialogDescription>Your court reservation is confirmed</DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-4 pt-1">
          {/* Animated Success Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="h-9 w-9 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          {/* Heading */}
          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide uppercase mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Booking Confirmed
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              You're All Set to Play!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your court reservation has been verified and confirmed.
            </p>
          </div>

          {/* Compact Facility Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3 text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">{bookingData.facilityName}</h3>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700">{bookingData.courtName}</p>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                ₹{bookingData.price}
              </span>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-600 pt-2.5 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate font-medium">{bookingData.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">{formatDate(bookingData.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">{formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-2.5 border-t border-slate-200">
              <span>ID: {bookingData.id.slice(-8).toUpperCase()}</span>
              <span>Receipt: {bookingData.receiptId}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              onClick={handleDownloadReceipt}
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm h-11 font-semibold rounded-xl"
            >
              <FileText className="h-4 w-4 mr-1.5 text-emerald-600" />
              Tax Invoice PDF
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm h-11 font-semibold rounded-xl"
            >
              <Share2 className="h-4 w-4 mr-1.5 text-emerald-600" />
              Share Details
            </Button>
          </div>

          {/* Primary Navigation Actions */}
          <div className="space-y-2.5 pt-1">
            <Button
              onClick={handleViewBookings}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm h-12 rounded-xl shadow-lg shadow-emerald-600/20"
            >
              View My Bookings
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>

            <Button
              onClick={handleBookAnother}
              variant="outline"
              className="w-full border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs sm:text-sm h-10 rounded-xl"
            >
              Book Another Venue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingSuccess;
