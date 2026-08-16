import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Calendar, CreditCard, ShieldCheck, AlertCircle, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { useRazorpayPayment, PaymentOptions } from '@/hooks/useRazorpayPayment';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate } from '@/lib/datetime';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string, bookingId: string) => void;
  bookingData: {
    id: string;
    facilityName: string;
    courtName: string;
    location: string;
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    duration: number; // in hours
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookingData,
}) => {
  const { processPayment, isLoading, error, setError } = useRazorpayPayment();
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return (parseLocalDate(dateString) || new Date(dateString)).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const handlePayment = async () => {
    setError(null);

    const paymentOptions: PaymentOptions = {
      bookingId: bookingData.id,
      amount: bookingData.price,
      facilityName: bookingData.facilityName,
      courtName: bookingData.courtName,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    };

    try {
      const result = await processPayment(paymentOptions);

      if (result.success && result.paymentId && result.bookingId) {
        toast({
          title: "Payment Successful!",
          description: "Your slot has been reserved successfully.",
        });
        onSuccess(result.paymentId, result.bookingId);
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Something went wrong during payment.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Failed to process payment.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[92vw] sm:w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <DialogHeader className="text-left space-y-1.5 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-slate-900">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <CreditCard className="h-5 w-5" />
              </div>
              Secure Checkout
            </DialogTitle>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Lock className="h-3.5 w-3.5" />
              256-Bit SSL
            </span>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Powered by Razorpay Secure Gateway. Review your booking details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Booking Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">{bookingData.facilityName}</h3>
                <p className="text-xs sm:text-sm font-semibold text-emerald-700">{bookingData.courtName}</p>
              </div>
              <Badge variant="outline" className="border-emerald-300 bg-emerald-100/60 text-emerald-800 text-xs font-semibold">
                {bookingData.sport}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate font-medium">{formatDate(bookingData.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate font-medium">{formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs sm:text-sm shadow-sm">
            <div className="flex justify-between text-slate-600">
              <span>Court Rate ({bookingData.duration}h)</span>
              <span className="font-medium text-slate-800">₹{(bookingData.price / (bookingData.duration || 1)).toFixed(0)} / hr</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Duration</span>
              <span className="font-medium text-slate-800">{bookingData.duration} Hour{bookingData.duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST & Taxes</span>
              <span className="text-emerald-700 font-semibold">₹0 (Included)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee</span>
              <span className="text-emerald-700 font-semibold">FREE</span>
            </div>
            
            <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center font-bold text-sm sm:text-base text-slate-900">
              <span>Total Payable</span>
              <span className="text-lg sm:text-xl text-emerald-600 font-extrabold">₹{bookingData.price}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Security Banner */}
          <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-3 flex items-center gap-2 text-xs text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Instant booking confirmation and official GST tax invoice upon successful payment.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1 border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm h-11 rounded-xl"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm h-11 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ₹{bookingData.price} Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
