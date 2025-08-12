import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, MapPin, Download, Share2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    id: string;
    paymentId: string;
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

  const handleShare = async () => {
    const bookingText = `🎾 Booking Confirmed at ${bookingData.facilityName}!\n\n📍 ${bookingData.location}\n🏟️ ${bookingData.courtName}\n📅 ${formatDate(bookingData.date)}\n🕐 ${formatTime(bookingData.startTime)} - ${formatTime(bookingData.endTime)}\n💰 ₹${bookingData.price}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QuickCourt Booking Confirmed',
          text: bookingText,
        });
      } catch (error) {
        console.log('Share cancelled');
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
    // This would typically generate and download a PDF receipt
    toast({
      title: "Download started",
      description: "Your receipt will be downloaded shortly.",
    });
    
    // For now, we'll just show a toast
    // In a real implementation, you'd generate a PDF or redirect to a receipt endpoint
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
      <DialogContent className="max-w-md mx-auto">
        <div className="text-center space-y-6">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-bold text-green-600">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600">
              Your court has been successfully booked and payment processed.
            </p>
          </motion.div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 space-y-3">
                <div className="text-left">
                  <h3 className="font-semibold text-green-900 text-lg">
                    {bookingData.facilityName}
                  </h3>
                  <p className="text-sm text-green-700">{bookingData.courtName}</p>
                </div>

                <div className="space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{bookingData.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-green-700">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(bookingData.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-green-700">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <span className="text-sm text-green-700">Total Paid</span>
                  <span className="font-bold text-green-900">₹{bookingData.price}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-green-600">
                  <span>Booking ID: {bookingData.id.slice(-8).toUpperCase()}</span>
                  <span>Payment ID: {bookingData.paymentId.slice(-8).toUpperCase()}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Receipt
              </Button>
            </div>

            {/* Primary Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleViewBookings}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View My Bookings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Button
                onClick={handleBookAnother}
                variant="outline"
                className="w-full"
              >
                Book Another Court
              </Button>
            </div>
          </motion.div>

          {/* Important Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg"
          >
            <p>
              📧 A confirmation email has been sent to your registered email address.
              Please arrive 10 minutes before your booking time.
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingSuccess;
