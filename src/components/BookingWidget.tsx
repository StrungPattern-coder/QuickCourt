import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatLocalDateInput, parseLocalDate, getRelativeDateLabel, isSlotInPast } from '@/lib/datetime';

interface VenueDetails {
  id: string;
  name: string;
  location: string;
  sports: {
    id: string;
    name: string;
    icon: string;
    isActive: boolean;
  }[];
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  isBooked?: boolean;
  isPast?: boolean;
  isMaintenance?: boolean;
  reason?: 'BOOKED' | 'PAST' | 'MAINTENANCE' | 'AVAILABLE';
  courtId: string;
  courtName: string;
}

interface BookingWidgetProps {
  venue: VenueDetails;
  timeSlots: TimeSlot[];
  selectedSport: string;
  selectedDate: string;
  selectedSlot: string;
  isLoadingSlots: boolean;
  onSportSelect: (sportId: string) => void;
  onDateSelect: (date: string) => void;
  onSlotSelect: (slotId: string) => void;
  onBookNow: () => void;
}

const BookingWidget = ({
  venue,
  timeSlots,
  selectedSport,
  selectedDate,
  selectedSlot,
  isLoadingSlots,
  onSportSelect,
  onDateSelect,
  onSlotSelect,
  onBookNow
}: BookingWidgetProps) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    return getRelativeDateLabel(dateString);
  };

  const selectedSlotData = timeSlots.find(slot => slot.id === selectedSlot);
  const activeSports = venue.sports.filter(sport => sport.isActive);
  const availableSlots = timeSlots.filter(slot => {
    const isPast = slot.isPast ?? isSlotInPast(selectedDate, slot.startTime);
    return slot.isAvailable && !isPast && !slot.isBooked && slot.reason !== 'BOOKED' && slot.reason !== 'MAINTENANCE';
  });

  // Generate date options (today + next 7 days)
  const dateOptions = Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const value = formatLocalDateInput(date);
    return {
      value,
      label: formatDate(value),
      date: date
    };
  });

  return (
    <Card className="shadow-lg border-green-200">
      <CardHeader className="pb-4 bg-green-50 border-b border-green-100">
        <CardTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Court Booking
        </CardTitle>
        <p className="text-sm text-green-600">
          Select your preferred time and court
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sport Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sport</label>
          <Select value={selectedSport} onValueChange={onSportSelect}>
            <SelectTrigger className="h-11 border-green-200 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Select a sport" />
            </SelectTrigger>
            <SelectContent>
              {activeSports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  <div className="flex items-center gap-2">
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <Select value={selectedDate} onValueChange={onDateSelect}>
            <SelectTrigger className="h-11 border-green-200 focus:border-green-500 focus:ring-green-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <SelectValue placeholder="Select date" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {option.date.toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Slot Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Available Time Slots</label>
            {selectedSport && selectedDate && (
              <span className="text-xs text-gray-500">
                {availableSlots.length} {availableSlots.length === 1 ? 'slot' : 'slots'} available
              </span>
            )}
          </div>

          {!selectedSport || !selectedDate ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select sport and date to view available slots</p>
            </div>
          ) : isLoadingSlots ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No slots available for this date</p>
              <p className="text-xs mt-1">Try selecting a different date</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto p-1">
              <AnimatePresence>
                {timeSlots.map((slot, index) => {
                  const isPast = slot.isPast ?? isSlotInPast(selectedDate, slot.startTime);
                  const isBooked = Boolean(slot.isBooked || slot.reason === 'BOOKED' || (!slot.isAvailable && !isPast && slot.reason !== 'MAINTENANCE'));
                  const isMaintenance = Boolean(slot.isMaintenance || slot.reason === 'MAINTENANCE');
                  const isAvailable = slot.isAvailable && !isPast && !isBooked && !isMaintenance;
                  const isSelected = selectedSlot === slot.id && isAvailable;

                  let cardStyle = 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer bg-white shadow-xs';
                  if (isSelected) {
                    cardStyle = 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20 cursor-pointer';
                  } else if (isBooked) {
                    cardStyle = 'border-rose-200 bg-rose-50/70 cursor-not-allowed select-none opacity-85';
                  } else if (isPast) {
                    cardStyle = 'border-gray-200 bg-gray-50/90 cursor-not-allowed select-none opacity-60';
                  } else if (isMaintenance) {
                    cardStyle = 'border-amber-200 bg-amber-50/70 cursor-not-allowed select-none opacity-85';
                  }

                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => isAvailable && onSlotSelect(slot.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${cardStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${
                              isBooked
                                ? 'text-rose-950 line-through'
                                : isPast
                                ? 'text-gray-400'
                                : isMaintenance
                                ? 'text-amber-950'
                                : 'text-gray-900'
                            }`}>
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${
                              isBooked
                                ? 'text-rose-800'
                                : isPast
                                ? 'text-gray-400'
                                : isMaintenance
                                ? 'text-amber-800'
                                : 'text-gray-500'
                            }`}>
                              {slot.courtName}
                            </span>
                            {isBooked ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider shadow-xs">
                                BOOKED
                              </span>
                            ) : isPast ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 uppercase tracking-wider">
                                UNAVAILABLE
                              </span>
                            ) : isMaintenance ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider shadow-xs">
                                MAINTENANCE
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            isBooked
                              ? 'text-rose-600 line-through text-sm'
                              : isPast
                              ? 'text-gray-400 text-sm'
                              : isMaintenance
                              ? 'text-amber-600 text-sm'
                              : 'text-emerald-600'
                          }`}>
                            ₹{slot.price}
                          </div>
                          <div className={`text-xs ${
                            isBooked
                              ? 'text-rose-700/80'
                              : isPast
                              ? 'text-gray-400'
                              : isMaintenance
                              ? 'text-amber-700/80'
                              : 'text-gray-500'
                          }`}>
                            {isBooked ? 'Unavailable' : isPast ? 'Time Passed' : isMaintenance ? 'Unavailable' : 'per hour'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Selected Slot Summary */}
        {selectedSlotData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <h4 className="font-medium text-green-900 mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Sport:</span>
                <span className="font-medium text-green-900">
                  {venue.sports.find(s => s.id === selectedSport)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Date:</span>
                <span className="font-medium text-green-900">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Time:</span>
                <span className="font-medium text-green-900">
                  {formatTime(selectedSlotData.startTime)} - {formatTime(selectedSlotData.endTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Court:</span>
                <span className="font-medium text-green-900">{selectedSlotData.courtName}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-green-200">
                <span className="text-green-700">Total:</span>
                <span className="text-green-900">₹{selectedSlotData.price}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Book Now Button */}
        {(() => {
          const isSlotValid = Boolean(
            selectedSlotData &&
            selectedSlotData.isAvailable &&
            !selectedSlotData.isBooked &&
            selectedSlotData.reason !== 'BOOKED' &&
            !(selectedSlotData.isPast ?? isSlotInPast(selectedDate, selectedSlotData.startTime))
          );

          return (
            <Button
              onClick={onBookNow}
              disabled={!selectedSlot || !isSlotValid}
              className={`w-full h-12 text-lg font-semibold shadow-lg transition-all duration-200 ${
                selectedSlot && isSlotValid
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xl'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
              }`}
              size="lg"
            >
              {selectedSlot
                ? isSlotValid
                  ? `Book Now - ₹${selectedSlotData?.price}`
                  : 'Slot Unavailable'
                : 'Select a Time Slot'}
            </Button>
          );
        })()}

        {/* Trust Indicators */}
        <div className="pt-4 border-t border-green-100">
          <div className="flex items-center justify-center gap-4 text-xs text-green-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingWidget;

