import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon, 
  MapPinIcon, 
  ClockIcon, 
  DollarSignIcon,
  UploadIcon,
  ImageIcon,
  XIcon,
  InfoIcon,
  CheckCircleIcon,
  CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  sports: string[];
  amenities: string[];
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  courts: Court[];
  createdAt: string;
  updatedAt: string;
}

interface Court {
  id: string;
  name: string;
  pricePerHour: number;
  openTime: number;
  closeTime: number;
}

const VenueManagement: React.FC = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCourtDialog, setShowCourtDialog] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // Enhanced form states
  const [venueForm, setVenueForm] = useState({
    name: '',
    location: '',
    description: '',
    sports: [''],
    amenities: [''],
    images: [''],
    // New comprehensive fields
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    operatingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '07:00', close: '23:00', closed: false },
      sunday: { open: '07:00', close: '21:00', closed: false }
    },
    pricing: {
      basePrice: '',
      peakHourPrice: '',
      weekendPrice: '',
      currency: 'USD'
    },
    rules: {
      smokingAllowed: false,
      petsAllowed: false,
      foodAndDrinkAllowed: true,
      cancellationPolicy: '24 hours',
      maximumCapacity: '',
      minimumAge: '',
      dresscode: ''
    },
    facilities: {
      parking: false,
      restrooms: false,
      lockerRooms: false,
      showers: false,
      equipment: false,
      lighting: false,
      airConditioning: false,
      wifi: false,
      firstAid: false,
      security: false
    }
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'pricing' | 'photos'>('basic');
  const [currentStep, setCurrentStep] = useState(0);

  const [courtForm, setCourtForm] = useState({
    name: '',
    pricePerHour: '',
    openTime: '06:00',
    closeTime: '22:00'
  });

  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    if (user?.role === 'OWNER') {
      fetchMyVenues();
    }
  }, [user, filter]);

  const fetchMyVenues = async () => {
    try {
      setLoading(true);
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const response = await api.get(`/facilities/my-venues${params}`);
      setVenues((response.data as any)?.data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast.error('Failed to fetch your venues');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Starting venue creation...');
    console.log('📦 Current user:', user);
    console.log('🏗️ Venue form data:', venueForm);
    
    // Check authentication
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Access token exists:', !!token);
    
    try {
      // Process uploaded images
      let processedImages: string[] = [];
      if (uploadedImages.length > 0) {
        console.log('📸 Processing images...');
        toast.info('Processing images...');
        processedImages = await processImages();
      }

      // Prepare comprehensive venue data
      const fullAddress = `${venueForm.address.street}, ${venueForm.address.city}, ${venueForm.address.state} ${venueForm.address.zipCode}, ${venueForm.address.country}`;
      
      // Combine amenities with facilities
      const allAmenities = [
        ...venueForm.amenities.filter(a => a.trim()),
        ...Object.entries(venueForm.facilities)
          .filter(([_, enabled]) => enabled)
          .map(([facility, _]) => facility.replace(/([A-Z])/g, ' $1').trim())
      ];

      const data = {
        name: venueForm.name || 'Unnamed Venue',
        location: fullAddress || 'Location not specified',
        description: venueForm.description || 'No description provided',
        sports: venueForm.sports.filter(s => s.trim()).length > 0 ? venueForm.sports.filter(s => s.trim()) : ['General'],
        amenities: allAmenities,
        images: processedImages.length > 0 ? processedImages : venueForm.images.filter(i => i.trim())
      };

      console.log('📋 Final data to send:', data);

      const response = await api.post('/facilities', data);
      console.log('✅ Venue creation response:', response);
      
      toast.success('Venue submitted successfully! 🎉', {
        description: 'Your venue will be reviewed by our team and you\'ll be notified once it\'s approved.'
      });
      
      setShowAddDialog(false);
      resetVenueForm();
      fetchMyVenues();
    } catch (error: any) {
      console.error('❌ Error creating venue:', error);
      console.error('❌ Error details:', error.response?.data);
      toast.error(error.response?.data?.error || error.message || 'Failed to create venue');
    }
  };

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVenue) return;

    try {
      const [openHour, openMin] = courtForm.openTime.split(':').map(Number);
      const [closeHour, closeMin] = courtForm.closeTime.split(':').map(Number);
      
      const data = {
        name: courtForm.name,
        pricePerHour: parseFloat(courtForm.pricePerHour),
        openTime: openHour * 60 + openMin, // Convert to minutes
        closeTime: closeHour * 60 + closeMin
      };

      await api.post(`/facilities/${selectedVenue.id}/courts`, data);
      
      toast.success('Court added successfully!');
      setShowCourtDialog(false);
      resetCourtForm();
      fetchMyVenues();
    } catch (error: any) {
      console.error('Error adding court:', error);
      toast.error(error.response?.data?.error || 'Failed to add court');
    }
  };

  const resetVenueForm = () => {
    setVenueForm({
      name: '',
      location: '',
      description: '',
      sports: [''],
      amenities: [''],
      images: [''],
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      },
      contact: {
        phone: '',
        email: '',
        website: ''
      },
      operatingHours: {
        monday: { open: '06:00', close: '22:00', closed: false },
        tuesday: { open: '06:00', close: '22:00', closed: false },
        wednesday: { open: '06:00', close: '22:00', closed: false },
        thursday: { open: '06:00', close: '22:00', closed: false },
        friday: { open: '06:00', close: '22:00', closed: false },
        saturday: { open: '06:00', close: '22:00', closed: false },
        sunday: { open: '06:00', close: '22:00', closed: false }
      },
      pricing: {
        basePrice: '',
        peakHourPrice: '',
        weekendPrice: '',
        currency: 'INR'
      },
      rules: {
        smokingAllowed: false,
        petsAllowed: false,
        foodAndDrinkAllowed: true,
        cancellationPolicy: '24 hours',
        maximumCapacity: '',
        minimumAge: '',
        dresscode: ''
      },
      facilities: {
        parking: false,
        restrooms: false,
        lockerRooms: false,
        showers: false,
        equipment: false,
        lighting: false,
        airConditioning: false,
        wifi: false,
        firstAid: false,
        security: false
      }
    });
    setUploadedImages([]);
    setImagePreviewUrls([]);
    setActiveTab('basic');
  };

  const resetCourtForm = () => {
    setCourtForm({
      name: '',
      pricePerHour: '',
      openTime: '06:00',
      closeTime: '22:00'
    });
  };

  // Image upload handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (uploadedImages.length + validFiles.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setUploadedImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Convert images to base64 or upload to a service
  const processImages = async (): Promise<string[]> => {
    // For now, we'll use base64 encoding
    // In production, you'd upload to a service like AWS S3, Cloudinary, etc.
    const imagePromises = uploadedImages.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      return await Promise.all(imagePromises);
    } catch (error) {
      throw new Error('Failed to process images');
    }
  };

  const updateArrayField = (field: 'sports' | 'amenities' | 'images', index: number, value: string) => {
    setVenueForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'sports' | 'amenities' | 'images') => {
    setVenueForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'sports' | 'amenities' | 'images', index: number) => {
    setVenueForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status}
      </Badge>
    );
  };

  if (user?.role !== 'OWNER') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only venue owners can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Venues</h1>
          <p className="text-gray-600">Manage your sports venues and courts</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add New Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-600">Create New Venue</DialogTitle>
              <p className="text-sm text-gray-600">Fill in the details to list your venue. All fields are optional.</p>
            </DialogHeader>
            
            <div className="flex flex-col h-full">
              {/* Simplified Tab Navigation */}
              <div className="flex border-b mb-4">
                {[
                  { id: 'basic', label: 'Basic', icon: '🏢' },
                  { id: 'location', label: 'Location', icon: '�' },
                  { id: 'pricing', label: 'Pricing', icon: '💰' },
                  { id: 'photos', label: 'Photos', icon: '📸' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium">Venue Name</Label>
                          <Input
                            id="name"
                            value={venueForm.name}
                            onChange={(e) => setVenueForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Green Valley Sports"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="contact-phone" className="text-sm font-medium">Phone Number</Label>
                          <Input
                            id="contact-phone"
                            value={venueForm.contact.phone}
                            onChange={(e) => setVenueForm(prev => ({ 
                              ...prev, 
                              contact: { ...prev.contact, phone: e.target.value } 
                            }))}
                            placeholder="+91 98765 43210"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                        <Textarea
                          id="description"
                          value={venueForm.description}
                          onChange={(e) => setVenueForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your venue briefly..."
                          className="mt-1 h-20"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Sports Available</Label>
                          <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                            {venueForm.sports.map((sport, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={sport}
                                  onChange={(e) => updateArrayField('sports', index, e.target.value)}
                                  placeholder="e.g., Tennis, Basketball"
                                  className="text-sm"
                                />
                                {venueForm.sports.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeArrayField('sports', index)}
                                  >
                                    ×
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addArrayField('sports')}
                              className="w-full text-xs"
                            >
                              + Add Sport
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Key Facilities</Label>
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(venueForm.facilities).slice(0, 6).map(([facility, enabled]) => (
                              <label key={facility} className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  onChange={(e) => setVenueForm(prev => ({
                                    ...prev,
                                    facilities: { ...prev.facilities, [facility]: e.target.checked }
                                  }))}
                                  className="rounded text-xs"
                                />
                                <span className="capitalize text-xs">{facility}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location Tab - Combined Address & Contact */}
                  {activeTab === 'location' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="street" className="text-sm font-medium">Street Address</Label>
                        <Input
                          id="street"
                          value={venueForm.address.street}
                          onChange={(e) => setVenueForm(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, street: e.target.value } 
                          }))}
                          placeholder="123 Sports Complex Road"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city" className="text-sm font-medium">City</Label>
                          <Input
                            id="city"
                            value={venueForm.address.city}
                            onChange={(e) => setVenueForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, city: e.target.value } 
                            }))}
                            placeholder="Mumbai"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="state" className="text-sm font-medium">State</Label>
                          <Input
                            id="state"
                            value={venueForm.address.state}
                            onChange={(e) => setVenueForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, state: e.target.value } 
                            }))}
                            placeholder="Maharashtra"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="zipCode" className="text-sm font-medium">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            value={venueForm.address.zipCode}
                            onChange={(e) => setVenueForm(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, zipCode: e.target.value } 
                            }))}
                            placeholder="400001"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={venueForm.contact.email}
                          onChange={(e) => setVenueForm(prev => ({ 
                            ...prev, 
                            contact: { ...prev.contact, email: e.target.value } 
                          }))}
                          placeholder="info@venue.com"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Operating Hours (Optional)</Label>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-16">Weekdays:</span>
                            <Input
                              type="time"
                              value={venueForm.operatingHours.monday.open}
                              onChange={(e) => {
                                const newHours = { open: e.target.value, close: venueForm.operatingHours.monday.close, closed: false };
                                setVenueForm(prev => ({
                                  ...prev,
                                  operatingHours: {
                                    ...prev.operatingHours,
                                    monday: newHours,
                                    tuesday: newHours,
                                    wednesday: newHours,
                                    thursday: newHours,
                                    friday: newHours
                                  }
                                }));
                              }}
                              className="text-xs"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={venueForm.operatingHours.monday.close}
                              onChange={(e) => {
                                const newHours = { open: venueForm.operatingHours.monday.open, close: e.target.value, closed: false };
                                setVenueForm(prev => ({
                                  ...prev,
                                  operatingHours: {
                                    ...prev.operatingHours,
                                    monday: newHours,
                                    tuesday: newHours,
                                    wednesday: newHours,
                                    thursday: newHours,
                                    friday: newHours
                                  }
                                }));
                              }}
                              className="text-xs"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="w-16">Weekend:</span>
                            <Input
                              type="time"
                              value={venueForm.operatingHours.saturday.open}
                              onChange={(e) => {
                                const newHours = { open: e.target.value, close: venueForm.operatingHours.saturday.close, closed: false };
                                setVenueForm(prev => ({
                                  ...prev,
                                  operatingHours: {
                                    ...prev.operatingHours,
                                    saturday: newHours,
                                    sunday: newHours
                                  }
                                }));
                              }}
                              className="text-xs"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={venueForm.operatingHours.saturday.close}
                              onChange={(e) => {
                                const newHours = { open: venueForm.operatingHours.saturday.open, close: e.target.value, closed: false };
                                setVenueForm(prev => ({
                                  ...prev,
                                  operatingHours: {
                                    ...prev.operatingHours,
                                    saturday: newHours,
                                    sunday: newHours
                                  }
                                }));
                              }}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing Tab */}
                  {activeTab === 'pricing' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="basePrice" className="text-sm font-medium">Base Price (₹/hour)</Label>
                          <Input
                            id="basePrice"
                            type="number"
                            value={venueForm.pricing.basePrice}
                            onChange={(e) => setVenueForm(prev => ({ 
                              ...prev, 
                              pricing: { ...prev.pricing, basePrice: e.target.value } 
                            }))}
                            placeholder="1000"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="peakHourPrice" className="text-sm font-medium">Peak Hour (₹/hour)</Label>
                          <Input
                            id="peakHourPrice"
                            type="number"
                            value={venueForm.pricing.peakHourPrice}
                            onChange={(e) => setVenueForm(prev => ({ 
                              ...prev, 
                              pricing: { ...prev.pricing, peakHourPrice: e.target.value } 
                            }))}
                            placeholder="1500"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="weekendPrice" className="text-sm font-medium">Weekend (₹/hour)</Label>
                          <Input
                            id="weekendPrice"
                            type="number"
                            value={venueForm.pricing.weekendPrice}
                            onChange={(e) => setVenueForm(prev => ({ 
                              ...prev, 
                              pricing: { ...prev.pricing, weekendPrice: e.target.value } 
                            }))}
                            placeholder="1200"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Venue Rules & Policies</Label>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={venueForm.rules.smokingAllowed}
                                onChange={(e) => setVenueForm(prev => ({
                                  ...prev,
                                  rules: { ...prev.rules, smokingAllowed: e.target.checked }
                                }))}
                                className="rounded"
                              />
                              Smoking Allowed
                            </label>
                            
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={venueForm.rules.petsAllowed}
                                onChange={(e) => setVenueForm(prev => ({
                                  ...prev,
                                  rules: { ...prev.rules, petsAllowed: e.target.checked }
                                }))}
                                className="rounded"
                              />
                              Pets Allowed
                            </label>
                            
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={venueForm.rules.foodAndDrinkAllowed}
                                onChange={(e) => setVenueForm(prev => ({
                                  ...prev,
                                  rules: { ...prev.rules, foodAndDrinkAllowed: e.target.checked }
                                }))}
                                className="rounded"
                              />
                              Food & Drinks Allowed
                            </label>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor="cancellationPolicy" className="text-xs">Cancellation Policy</Label>
                              <select
                                id="cancellationPolicy"
                                value={venueForm.rules.cancellationPolicy}
                                onChange={(e) => setVenueForm(prev => ({
                                  ...prev,
                                  rules: { ...prev.rules, cancellationPolicy: e.target.value }
                                }))}
                                className="w-full p-1 border rounded text-sm"
                              >
                                <option value="24 hours">24 hours</option>
                                <option value="48 hours">48 hours</option>
                                <option value="72 hours">72 hours</option>
                                <option value="No cancellation">No cancellation</option>
                              </select>
                            </div>
                            
                            <div>
                              <Label htmlFor="maximumCapacity" className="text-xs">Max Capacity</Label>
                              <Input
                                id="maximumCapacity"
                                type="number"
                                value={venueForm.rules.maximumCapacity}
                                onChange={(e) => setVenueForm(prev => ({
                                  ...prev,
                                  rules: { ...prev.rules, maximumCapacity: e.target.value }
                                }))}
                                placeholder="50"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Photos Tab */}
                  {activeTab === 'photos' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Venue Photos</Label>
                        <p className="text-xs text-gray-600 mb-3">Add photos to attract more customers (up to 5 images, max 5MB each)</p>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="text-gray-400 mb-2">
                              <svg className="mx-auto h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600">Click to upload images</p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                          </label>
                        </div>
                        
                        {/* Image Previews */}
                        {imagePreviewUrls.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            {imagePreviewUrls.map((url, index) => (
                              <div key={index} className="relative">
                                <img src={url} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded border" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* URL Images - Simplified */}
                        <div className="mt-3">
                          <Label className="text-xs font-medium">Or add image URLs (Optional)</Label>
                          <div className="space-y-1 mt-1">
                            {venueForm.images.slice(0, 2).map((image, index) => (
                              <Input
                                key={index}
                                value={image}
                                onChange={(e) => updateArrayField('images', index, e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="text-sm"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      className="text-sm"
                    >
                      Cancel
                    </Button>
                    
                    <div className="flex gap-2">
                      {activeTab !== 'basic' && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const tabs = ['basic', 'location', 'pricing', 'photos'];
                            const currentIndex = tabs.indexOf(activeTab);
                            if (currentIndex > 0) {
                              setActiveTab(tabs[currentIndex - 1] as any);
                            }
                          }}
                          className="text-sm"
                        >
                          Previous
                        </Button>
                      )}
                      
                      {activeTab !== 'photos' ? (
                        <Button
                          type="button"
                          onClick={() => {
                            const tabs = ['basic', 'location', 'pricing', 'photos'];
                            const currentIndex = tabs.indexOf(activeTab);
                            if (currentIndex < tabs.length - 1) {
                              setActiveTab(tabs[currentIndex + 1] as any);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-sm"
                        >
                          Next
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleCreateVenue}
                          className="bg-green-600 hover:bg-green-700 text-sm"
                        >
                          Create Venue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status as typeof filter)}
            className={filter === status ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Venues Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your venues...</p>
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPinIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'ALL' 
              ? "You haven't created any venues yet." 
              : `No venues with status "${filter}".`}
          </p>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Create Your First Venue
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Card key={venue.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  {getStatusBadge(venue.status)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {venue.location}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {venue.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap gap-1">
                    {venue.sports.map((sport, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{venue.courts.length} courts</span>
                    <span>Created {new Date(venue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {venue.status === 'APPROVED' && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm mb-2">Courts:</h4>
                    <div className="space-y-1">
                      {venue.courts.slice(0, 2).map((court) => (
                        <div key={court.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                          <span>{court.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center">
                              <DollarSignIcon className="w-3 h-3 mr-1" />
                              {court.pricePerHour}/hr
                            </span>
                            <span className="flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {formatTime(court.openTime)}-{formatTime(court.closeTime)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {venue.courts.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{venue.courts.length - 2} more courts
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {venue.status === 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVenue(venue);
                        setShowCourtDialog(true);
                      }}
                      className="flex-1"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Court
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/venues/${venue.id}`, '_blank')}
                    className="flex-1"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Court Dialog */}
      <Dialog open={showCourtDialog} onOpenChange={setShowCourtDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Court to {selectedVenue?.name}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddCourt} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Court Name</label>
              <Input
                value={courtForm.name}
                onChange={(e) => setCourtForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Court 1, Tennis Court A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price per Hour ($)</label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={courtForm.pricePerHour}
                onChange={(e) => setCourtForm(prev => ({ ...prev, pricePerHour: e.target.value }))}
                placeholder="25.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Open Time</label>
                <Input
                  type="time"
                  value={courtForm.openTime}
                  onChange={(e) => setCourtForm(prev => ({ ...prev, openTime: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Close Time</label>
                <Input
                  type="time"
                  value={courtForm.closeTime}
                  onChange={(e) => setCourtForm(prev => ({ ...prev, closeTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCourtDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Add Court
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueManagement;
