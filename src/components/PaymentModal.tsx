import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Calendar, CreditCard, ShieldCheck, AlertCircle, Loader2, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
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
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
      <DialogContent className="max-w-md w-[92vw] sm:w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 text-white p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all">
        <DialogHeader className="text-left space-y-1 pb-2 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CreditCard className="h-4 w-4" />
              </div>
              Checkout Payment
            </DialogTitle>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Lock className="h-3 w-3" />
              256-Bit SSL
            </span>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Powered by Razorpay Secure. Review order details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Booking Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-white">{bookingData.facilityName}</h3>
                <p className="text-xs font-medium text-emerald-400">{bookingData.courtName}</p>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[11px]">
                {bookingData.sport}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{formatDate(bookingData.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Court Rate ({bookingData.duration}h)</span>
              <span className="text-slate-200">₹{(bookingData.price / bookingData.duration).toFixed(0)} / hr</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Duration</span>
              <span className="text-slate-200">{bookingData.duration} Hour{bookingData.duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Convenience & Tax</span>
              <span className="text-emerald-400 font-medium">Included</span>
            </div>
            
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-sm text-white">
              <span>Total Payable</span>
              <span className="text-base text-emerald-400 font-extrabold">₹{bookingData.price}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Demo Info Box */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] leading-relaxed text-amber-200/90">
            <span className="font-bold text-amber-300">Demo Gateway Mode:</span> Standard test cards or instant click verification process payment smoothly.
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs h-11"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-11 shadow-lg shadow-emerald-500/20 transition-all"
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
