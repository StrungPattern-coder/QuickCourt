import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  X, 
  Clock, 
  DollarSign, 
  MapPin, 
  FileText,
  Wifi,
  Car,
  Bath,
  Users,
  Zap,
  ShieldCheck,
  Coffee,
  AirVent,
  Dumbbell
} from 'lucide-react';
import { facilitiesApi, courtsApi } from '@/lib/api';
import ImageUpload from './ImageUpload';

interface AddCourtFormProps {
  onCourtAdded?: () => void;
  onCancel?: () => void;
}

const SPORTS_OPTIONS = [
  'Tennis',
  'Basketball',
  'Badminton',
  'Squash', 
  'Football',
  'Cricket',
  'Volleyball',
  'Table Tennis',
  'Hockey',
  'Swimming'
];

const AMENITIES_OPTIONS = [
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'shower', label: 'Shower/Changing Rooms', icon: Bath },
  { id: 'locker', label: 'Lockers', icon: Users },
  { id: 'lighting', label: 'Professional Lighting', icon: Zap },
  { id: 'security', label: '24/7 Security', icon: ShieldCheck },
  { id: 'cafe', label: 'Café/Refreshments', icon: Coffee },
  { id: 'ac', label: 'Air Conditioning', icon: AirVent },
  { id: 'equipment', label: 'Equipment Rental', icon: Dumbbell },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const time12 = hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
  return { value: hour * 60, label: time12 }; // Convert to minutes from midnight
});

export default function AddCourtForm({ onCourtAdded, onCancel }: AddCourtFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    // Facility details
    facilityName: '',
    location: '',
    description: '',
    sports: [] as string[],
    amenities: [] as string[],
    
    // Court details
    courtName: '',
    pricePerHour: '',
    openTime: 6 * 60, // 6:00 AM in minutes
    closeTime: 22 * 60, // 10:00 PM in minutes
    
    // Booking status (mock for now)
    status: 'Available' as 'Available' | 'Booked' | 'Cancelled' | 'Completed'
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSport = (sport: string) => {
    if (!formData.sports.includes(sport)) {
      updateFormData('sports', [...formData.sports, sport]);
    }
  };

  const removeSport = (sport: string) => {
    updateFormData('sports', formData.sports.filter(s => s !== sport));
  };

  const toggleAmenity = (amenityId: string) => {
    const amenities = formData.amenities.includes(amenityId)
      ? formData.amenities.filter(a => a !== amenityId)
      : [...formData.amenities, amenityId];
    updateFormData('amenities', amenities);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const validateStep1 = () => {
    const isValid = formData.facilityName.trim() && 
           formData.location.trim() && 
           formData.description.trim().length >= 10 &&
           formData.sports.length > 0;
    
    return isValid;
  };

  const validateStep2 = () => {
    return formData.courtName.trim() && 
           formData.pricePerHour && 
           parseFloat(formData.pricePerHour) > 0 &&
           formData.closeTime > formData.openTime;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // First create the facility
      const facilityData = {
        name: formData.facilityName,
        location: formData.location,
        description: formData.description,
        sports: formData.sports,
        amenities: formData.amenities,
        images: images
      };

      const facility = await facilitiesApi.create(facilityData) as any;
      
      // Then create the court
      const courtData = {
        name: formData.courtName,
        facilityId: facility.id,
        pricePerHour: parseFloat(formData.pricePerHour),
        openTime: formData.openTime,
        closeTime: formData.closeTime
      };

      await courtsApi.create(courtData);

      toast.success('Court added successfully! Your facility is now pending admin approval.');
      
      // Reset form
      setFormData({
        facilityName: '',
        location: '',
        description: '',
        sports: [],
        amenities: [],
        courtName: '',
        pricePerHour: '',
        openTime: 6 * 60,
        closeTime: 22 * 60,
        status: 'Available'
      });
      setImages([]);
      setStep(1);
      
      onCourtAdded?.();
    } catch (error: any) {
      console.error('Failed to create court:', error);
      toast.error(error.message || 'Failed to create court. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 1) {
      toast.error('Please complete all required fields in Step 1');
    }
  };

  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Add New Court
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={step === 1 ? "default" : "secondary"}>
            1. Facility Details
          </Badge>
          <Badge variant={step === 2 ? "default" : "secondary"}>
            2. Court Configuration
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Facility Name */}
              <div className="space-y-2">
                <Label htmlFor="facilityName" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Facility Name *
                </Label>
                <Input
                  id="facilityName"
                  placeholder="e.g., Elite Sports Complex"
                  value={formData.facilityName}
                  onChange={(e) => updateFormData('facilityName', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown Sports District, City Center"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your facility, its features, and what makes it special..."
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/10 characters minimum
                {formData.description.trim().length < 10 && (
                  <span className="text-destructive ml-2">
                    Need {10 - formData.description.trim().length} more characters
                  </span>
                )}
              </p>
            </div>

            {/* Sports Supported */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Sports Supported * 
                {formData.sports.length === 0 && (
                  <span className="text-destructive ml-2 font-normal">
                    Please select at least one sport
                  </span>
                )}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {SPORTS_OPTIONS.map((sport) => (
                  <Button
                    key={sport}
                    type="button"
                    variant={formData.sports.includes(sport) ? "default" : "outline"}
                    size="sm"
                    onClick={() => formData.sports.includes(sport) ? removeSport(sport) : addSport(sport)}
                    className="justify-start"
                  >
                    {sport}
                  </Button>
                ))}
              </div>
              {formData.sports.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sports.map((sport) => (
                    <Badge key={sport} variant="secondary" className="gap-1">
                      {sport}
                      <button
                        onClick={() => removeSport(sport)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Amenities Offered</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_OPTIONS.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <Label
                        htmlFor={amenity.id}
                        className="text-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {amenity.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Images */}
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={10}
            />

            {/* Step 1 Validation Summary */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4">
                <div className="text-sm space-y-2">
                  <h4 className="font-medium">Step 1 Requirements:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-2 ${formData.facilityName.trim() ? 'text-green-600' : 'text-destructive'}`}>
                      <div className={`w-2 h-2 rounded-full ${formData.facilityName.trim() ? 'bg-green-600' : 'bg-destructive'}`}></div>
                      Facility Name
                    </div>
                    <div className={`flex items-center gap-2 ${formData.location.trim() ? 'text-green-600' : 'text-destructive'}`}>
                      <div className={`w-2 h-2 rounded-full ${formData.location.trim() ? 'bg-green-600' : 'bg-destructive'}`}></div>
                      Location
                    </div>
                    <div className={`flex items-center gap-2 ${formData.description.trim().length >= 10 ? 'text-green-600' : 'text-destructive'}`}>
                      <div className={`w-2 h-2 rounded-full ${formData.description.trim().length >= 10 ? 'bg-green-600' : 'bg-destructive'}`}></div>
                      Description (10+ chars)
                    </div>
                    <div className={`flex items-center gap-2 ${formData.sports.length > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      <div className={`w-2 h-2 rounded-full ${formData.sports.length > 0 ? 'bg-green-600' : 'bg-destructive'}`}></div>
                      Sports Selected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Court Name */}
              <div className="space-y-2">
                <Label htmlFor="courtName" className="text-sm font-medium">
                  Court Name *
                </Label>
                <Input
                  id="courtName"
                  placeholder="e.g., Court 1, Tennis Court A"
                  value={formData.courtName}
                  onChange={(e) => updateFormData('courtName', e.target.value)}
                />
              </div>

              {/* Price per Hour */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price per Hour ($) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="e.g., 50"
                  value={formData.pricePerHour}
                  onChange={(e) => updateFormData('pricePerHour', e.target.value)}
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Operating Hours *
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime" className="text-xs text-muted-foreground">
                    Opening Time
                  </Label>
                  <Select
                    value={formData.openTime.toString()}
                    onValueChange={(value) => updateFormData('openTime', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value.toString()}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="closeTime" className="text-xs text-muted-foreground">
                    Closing Time
                  </Label>
                  <Select
                    value={formData.closeTime.toString()}
                    onValueChange={(value) => updateFormData('closeTime', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.filter(time => time.value > formData.openTime).map((time) => (
                        <SelectItem key={time.value} value={time.value.toString()}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Operating: {formatTime(formData.openTime)} - {formatTime(formData.closeTime)}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => updateFormData('status', value)}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Facility:</span> {formData.facilityName}</p>
                    <p><span className="font-medium">Location:</span> {formData.location}</p>
                    <p><span className="font-medium">Court:</span> {formData.courtName}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Price:</span> ${formData.pricePerHour}/hour</p>
                    <p><span className="font-medium">Hours:</span> {formatTime(formData.openTime)} - {formatTime(formData.closeTime)}</p>
                    <p><span className="font-medium">Sports:</span> {formData.sports.join(', ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Separator />

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {step < 2 ? (
              <Button onClick={nextStep} disabled={!validateStep1()}>
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validateStep2()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Court'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
