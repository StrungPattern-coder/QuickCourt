import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
      const d = new Date(`2000-01-01T${timeString}`);
      if (Number.isNaN(d.getTime())) return timeString;
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
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
      <DialogContent className="max-w-md w-[92vw] sm:w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 text-white p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-4">
          {/* Animated Success Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
            className="flex justify-center pt-1"
          >
            <div className="relative">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </motion.div>

          {/* Heading */}
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wide uppercase mb-1">
              <Sparkles className="h-3 w-3" /> Booking Confirmed
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              You're All Set to Play!
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Your court reservation has been verified and confirmed.
            </p>
          </div>

          {/* Compact Facility Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-2.5 text-left">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-sm text-white">{bookingData.facilityName}</h3>
                <p className="text-xs font-medium text-emerald-400">{bookingData.courtName}</p>
              </div>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                ₹{bookingData.price}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{bookingData.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>{formatDate(bookingData.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>{formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
              <span>ID: {bookingData.id.slice(-8).toUpperCase()}</span>
              <span>Receipt: {bookingData.receiptId}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDownloadReceipt}
              variant="outline"
              size="sm"
              className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs h-10 font-semibold"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              Tax Invoice PDF
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs h-10 font-semibold"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              Share Details
            </Button>
          </div>

          {/* Primary Navigation Actions */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={handleViewBookings}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-11 shadow-lg shadow-emerald-500/20"
            >
              View My Bookings
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>

            <Button
              onClick={handleBookAnother}
              variant="outline"
              className="w-full border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs h-10"
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
