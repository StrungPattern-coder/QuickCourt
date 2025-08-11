import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Plus, 
  Minus, 
  IndianRupee,
  Loader2,
  Trophy,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { facilitiesApi } from '@/lib/api';

interface VenueSummary {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  image: string;
}

interface BookingData {
  venueId: string;
  sport: string;
  date: string;
  startTime: string;
  duration: number;
  court: string;
  price: number;
}

interface AvailableSlot {
  time: string;
  courts: string[];
  isAvailable: boolean;
}

interface BookingFormCardProps {
  venue: VenueSummary;
  preSelectedSport?: string;
  preSelectedDate?: string;
  preSelectedTime?: string;
  preSelectedCourt?: string;
  onBookingComplete: (bookingData: BookingData) => void;
}

const BookingFormCard: React.FC<BookingFormCardProps> = ({
  venue,
  preSelectedSport = '',
  preSelectedDate = '',
  preSelectedTime = '',
  preSelectedCourt = '',
  onBookingComplete
}) => {
  const { toast } = useToast();

  // Form state
  const [sport, setSport] = useState(preSelectedSport);
  const [date, setDate] = useState(preSelectedDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(preSelectedTime);
  const [duration, setDuration] = useState(1);
  const [court, setCourt] = useState(preSelectedCourt);
  const [price, setPrice] = useState(0);

  // Loading states
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Available options
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [availableCourts, setAvailableCourts] = useState<string[]>([]);

  // Mock data
  const sportsOptions = [
    { id: 'badminton', name: 'Badminton', icon: '🏸' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'cricket', name: 'Cricket', icon: '🏏' },
    { id: 'football', name: 'Football', icon: '⚽' }
  ];

  const durationOptions = [
    { value: 1, label: '1 Hr' },
    { value: 1.5, label: '1.5 Hr' },
    { value: 2, label: '2 Hr' },
    { value: 2.5, label: '2.5 Hr' },
    { value: 3, label: '3 Hr' }
  ];

  // Generate mock time slots
  const generateMockSlots = (): AvailableSlot[] => {
    const slots: AvailableSlot[] = [];
    const now = new Date();
    const selectedDate = new Date(date);
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    for (let hour = 5; hour <= 22; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, 0, 0, 0);
      
      // Disable past slots for today
      const isPastSlot = isToday && slotTime <= now;
      
      slots.push({
        time: timeString,
        courts: ['Court 1', 'Court 2', 'Court 3', 'Court 4'],
        isAvailable: !isPastSlot && Math.random() > 0.3 // 70% availability
      });
    }
    
    return slots;
  };

  // Effects
  useEffect(() => {
    if (sport && date) {
      fetchAvailableSlots();
    }
  }, [sport, date]);

  useEffect(() => {
    if (startTime && sport) {
      updateAvailableCourts();
    }
  }, [startTime, sport, availableSlots]);

  useEffect(() => {
    if (sport && startTime && duration) {
      calculatePrice();
    }
  }, [sport, startTime, duration]);

  // API Functions
  const fetchAvailableSlots = async () => {
    try {
      setIsLoadingSlots(true);
      // TODO: Replace with actual API call
      // const response = await facilitiesApi.getAvailability(venue.id, { sport, date });
      // setAvailableSlots(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        const mockSlots = generateMockSlots();
        setAvailableSlots(mockSlots);
        setIsLoadingSlots(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots.",
        variant: "destructive"
      });
      setIsLoadingSlots(false);
    }
  };

  const updateAvailableCourts = () => {
    const slot = availableSlots.find(s => s.time === startTime);
    if (slot) {
      setAvailableCourts(slot.courts);
      // Auto-select first available court if none selected
      if (!court && slot.courts.length > 0) {
        setCourt(slot.courts[0]);
      }
    }
  };

  const calculatePrice = async () => {
    try {
      setIsCalculatingPrice(true);
      // TODO: Replace with actual API call
      // const response = await facilitiesApi.calculatePrice({ sport, startTime, duration });
      // setPrice(response.data.price);
      
      // Using mock calculation for now
      setTimeout(() => {
        const basePrice = sport === 'badminton' ? 500 : sport === 'tennis' ? 800 : 600;
        const calculatedPrice = basePrice * duration;
        setPrice(calculatedPrice);
        setIsCalculatingPrice(false);
      }, 300);
    } catch (error) {
      console.error('Error calculating price:', error);
      setIsCalculatingPrice(false);
    }
  };

  const handleSubmit = async () => {
    if (!sport || !date || !startTime || !court) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const bookingData: BookingData = {
      venueId: venue.id,
      sport,
      date,
      startTime,
      duration,
      court,
      price
    };

    setIsCreatingBooking(true);
    await onBookingComplete(bookingData);
    setIsCreatingBooking(false);
  };

  const isFormValid = sport && date && startTime && court && price > 0;

  return (
    <Card className="shadow-xl border-green-200">
      <CardHeader className="bg-green-50 border-b border-green-100">
        {/* Venue Summary */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <span className="text-white text-2xl">🏟️</span>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-green-800">{venue.name}</h2>
            <div className="flex items-center gap-2 text-green-600 mt-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{venue.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-700">{venue.rating}</span>
                <span className="text-sm text-gray-500">({venue.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Sport Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-600" />
            Sport
          </label>
          <Select value={sport} onValueChange={setSport}>
            <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Select a sport" />
            </SelectTrigger>
            <SelectContent>
              {sportsOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-600" />
            Date
          </label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-green-200 rounded-lg focus:border-green-500 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Start Time Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            Start Time
          </label>
          {isLoadingSlots ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map(slot => (
                  <SelectItem 
                    key={slot.time} 
                    value={slot.time}
                    disabled={!slot.isAvailable}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{slot.time}</span>
                      {!slot.isAvailable && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Duration</label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration(Math.max(1, duration - 0.5))}
              disabled={duration <= 1}
              className="h-10 w-10 p-0 border-green-200 hover:bg-green-50"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 text-center">
              <div className="px-4 py-2 border border-green-200 rounded-lg bg-green-50">
                <span className="font-medium text-green-800">{duration} Hr</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDuration(Math.min(3, duration + 0.5))}
              disabled={duration >= 3}
              className="h-10 w-10 p-0 border-green-200 hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Court Selection */}
        {startTime && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Court
            </label>
            <Select value={court} onValueChange={setCourt}>
              <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent>
                {availableCourts.map(courtOption => (
                  <SelectItem key={courtOption} value={courtOption}>
                    {courtOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Price Summary */}
        {price > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-green-800">Total Amount</h4>
                <p className="text-sm text-green-600">
                  {duration} hour{duration !== 1 ? 's' : ''} • {startTime}
                </p>
              </div>
              <div className="text-right">
                {isCalculatingPrice ? (
                  <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                ) : (
                  <div className="flex items-center text-2xl font-bold text-green-700">
                    <IndianRupee className="h-5 w-5" />
                    {price.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isCreatingBooking}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isCreatingBooking ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Booking...
            </div>
          ) : isFormValid ? (
            <div className="flex items-center gap-2">
              Continue to Payment
              <IndianRupee className="h-5 w-5" />
              {price.toFixed(2)}
            </div>
          ) : (
            'Complete Form to Continue'
          )}
        </Button>

        {/* Trust Indicators */}
        <div className="pt-4 border-t border-green-100">
          <div className="flex items-center justify-center gap-6 text-xs text-green-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingFormCard;
