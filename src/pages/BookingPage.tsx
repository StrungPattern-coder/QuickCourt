import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import BrandNav from '@/components/BrandNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  CreditCard, 
  Users, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Mock data for development
const mockCourt = {
  id: 'court1',
  name: 'Court 1 - Professional',
  facilityId: '1',
  pricePerHour: 25,
  openTime: 360, // 6 AM
  closeTime: 1320, // 10 PM
  facility: {
    id: '1',
    name: 'Central Park Courts',
    location: '123 Park Avenue, New York, NY 10001',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=200&fit=crop'
  }
};

const BookingPage = () => {
  const { facilityId, courtId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'confirmation'>('details');

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    const startTime = mockCourt.openTime;
    const endTime = mockCourt.closeTime;
    
    for (let time = startTime; time < endTime; time += 60) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      
      // Mock availability (some slots unavailable)
      const isAvailable = Math.random() > 0.3; // 70% availability
      
      slots.push({
        time: timeString,
        value: time.toString(),
        available: isAvailable
      });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const totalPrice = mockCourt.pricePerHour * duration;

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement actual booking API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setBookingStep('confirmation');
      toast({
        title: "Booking confirmed!",
        description: "Your court has been reserved successfully.",
      });
    } catch (error) {
      toast({
        title: "Booking failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatSelectedDateTime = () => {
    if (!selectedDate || !selectedTime) return '';
    
    const timeSlot = timeSlots.find(slot => slot.value === selectedTime);
    return `${selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })} at ${timeSlot?.time}`;
  };

  if (bookingStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Booking Confirmed - QuickCourt" description="Your booking has been confirmed" />
        <BrandNav />
        
        <main className="container mx-auto px-4 py-10 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Booking Confirmed!</CardTitle>
              <CardDescription>
                Your court reservation has been successfully created
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue:</span>
                    <span>{mockCourt.facility.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Court:</span>
                    <span>{mockCourt.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span>{formatSelectedDateTime()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{duration} hour{duration > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Paid:</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cancellation Policy:</strong> You can cancel this booking for free up to 30 minutes before the start time.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/my-bookings')} className="flex-1">
                  View My Bookings
                </Button>
                <Button onClick={() => navigate('/venues')} variant="outline" className="flex-1">
                  Book Another Court
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Book ${mockCourt.name} - QuickCourt`} description="Complete your court booking" />
      <BrandNav />
      
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Your Court</h1>
          <p className="text-muted-foreground">Complete your reservation details below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Court Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img 
                    src={mockCourt.facility.image} 
                    alt={mockCourt.facility.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{mockCourt.facility.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {mockCourt.facility.location}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{mockCourt.name}</Badge>
                  <span className="text-sm text-muted-foreground">${mockCourt.pricePerHour}/hour</span>
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border w-fit"
                />
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Select Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.value}
                      variant={selectedTime === slot.value ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.value)}
                      className="text-xs"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Duration & Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="4"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Special Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Court:</span>
                    <span>{mockCourt.name}</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{selectedDate.toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span>{timeSlots.find(s => s.value === selectedTime)?.time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{duration} hour{duration > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span>${mockCourt.pricePerHour}/hour</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${totalPrice}</span>
                </div>

                <Button
                  className="w-full"
                  disabled={!selectedDate || !selectedTime || isLoading}
                  onClick={handleBooking}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Confirm & Pay ${totalPrice}
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  <p>🔒 Secure payment powered by Stripe</p>
                  <p>💳 We accept all major credit cards</p>
                  <p>🚫 Free cancellation up to 30 minutes before</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
