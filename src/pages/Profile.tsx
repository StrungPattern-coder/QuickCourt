import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Camera, Save, Calendar, Clock, MapPin, X, Eye, EyeOff, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BrandNav from '@/components/BrandNav';
import SEO from '@/components/SEO';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, Booking } from '@/lib/api';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Fetch user bookings
  const { data: bookings = [], isLoading: isLoadingBookings, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingsApi.getMy,
    enabled: isAuthenticated,
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'OWNER':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Full name is required.',
      });
      return;
    }

    // If changing password, validate
    if (newPassword && !oldPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Current password is required to set a new password.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement profile update API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setOldPassword('');
    setNewPassword('');
    setIsEditing(false);
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setOldPassword('');
    setNewPassword('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      case 'COMPLETED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const canCancel = (booking: Booking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return booking.status === 'CONFIRMED' && minutesDiff > 30;
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      // TODO: Implement cancel booking API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
      
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const filterBookings = (bookings: Booking[], filter: string) => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(b => new Date(b.startTime) > now && b.status !== 'CANCELLED');
      case 'cancelled':
        return bookings.filter(b => b.status === 'CANCELLED');
      default:
        return bookings;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{booking.court.facility.name}</h3>
            <p className="text-sm text-muted-foreground">{booking.court.name}</p>
          </div>
          <Badge variant={getStatusColor(booking.status) as any} className="ml-2">
            {booking.status === 'CONFIRMED' ? '✓ Confirmed' : booking.status}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4 text-red-500" />
            {formatDate(booking.startTime)}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            {booking.court.facility.location}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold">
            ₹ {Number(booking.price).toFixed(2)}
          </span>
          
          <div className="flex gap-2">
            {canCancel(booking) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep booking</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleCancelBooking(booking.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, cancel booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {booking.status === 'COMPLETED' && (
              <Button variant="outline" size="sm">
                <MessageSquare className="mr-1 h-4 w-4" />
                Write Review
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Profile - QuickCourt" description="Manage your QuickCourt profile" path="/profile" />
      <BrandNav />
      
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Page</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                    <AvatarFallback className="text-xl bg-gray-200">
                      {user?.fullName ? getInitials(user.fullName) : 'MA'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="mt-4">
                  <h2 className="text-xl font-semibold">{user?.fullName || 'Mitchell Admin'}</h2>
                  <p className="text-gray-600">{user?.role === 'USER' ? '9999999999' : '8888888888'}</p>
                  <p className="text-gray-600 text-sm">{user?.email || 'mitchelladmin20@gmail.com'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  variant={isEditing ? "default" : "outline"} 
                  className="w-full justify-start"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  Edit Profile
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile" className="text-sm">Edit Profile</TabsTrigger>
                <TabsTrigger value="bookings" className="text-sm">All Bookings</TabsTrigger>
              </TabsList>
              
              {/* Edit Profile Tab */}
              <TabsContent value="profile">
                <Card className="p-6">
                  <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                          <AvatarFallback className="text-2xl bg-gray-200">
                            {user?.fullName ? getInitials(user.fullName) : 'MA'}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={!isEditing}
                          placeholder="Enter your full name"
                          className="bg-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={true}
                          placeholder="Enter your email"
                          className="bg-gray-50"
                        />
                      </div>

                      {isEditing && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="oldPassword">Old Password</Label>
                            <div className="relative">
                              <Input
                                id="oldPassword"
                                type={showOldPassword ? "text" : "password"}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="bg-white pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                              >
                                {showOldPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="bg-white pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex justify-between pt-4">
                        <Button 
                          variant="outline" 
                          onClick={handleReset}
                          className="px-8"
                        >
                          Reset
                        </Button>
                        <div className="space-x-3">
                          <Button 
                            variant="outline" 
                            onClick={handleCancel}
                            className="px-8"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSave} 
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 px-8"
                          >
                            {isLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Bookings Tab */}
              <TabsContent value="bookings">
                <Card className="p-6">
                  <div className="mb-6">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="all">All Bookings</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all">
                        {isLoadingBookings ? (
                          <div className="space-y-4">
                            {[1, 2].map((i) => (
                              <Card key={i}>
                                <CardContent className="pt-6">
                                  <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-4 bg-muted rounded w-1/2"></div>
                                    <div className="h-4 bg-muted rounded w-2/3"></div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filterBookings(bookings || [], 'all').length === 0 ? (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">No bookings found.</p>
                                <Button onClick={() => window.location.href = '/venues'}>
                                  Book a Court
                                </Button>
                              </div>
                            ) : (
                              filterBookings(bookings || [], 'all').map((booking) => (
                                <BookingCard key={booking.id} booking={booking} />
                              ))
                            )}
                            {/* Note about past bookings */}
                            {filterBookings(bookings || [], 'all').length > 0 && (
                              <div className="text-xs text-gray-500 text-right mt-4">
                                * No cancel booking button for past dates
                              </div>
                            )}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="cancelled">
                        <div className="space-y-4">
                          {filterBookings(bookings || [], 'cancelled').length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No cancelled bookings.</p>
                            </div>
                          ) : (
                            filterBookings(bookings || [], 'cancelled').map((booking) => (
                              <BookingCard key={booking.id} booking={booking} />
                            ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
