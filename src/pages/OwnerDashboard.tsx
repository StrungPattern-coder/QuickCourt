import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  PlusIcon, 
  HomeIcon, 
  CalendarIcon, 
  DollarSignIcon, 
  UsersIcon,
  TrendingUpIcon,
  MapPinIcon,
  ClockIcon,
  BellIcon,
  EyeIcon,
  EditIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import SEO from '../components/SEO';
import BrandNav from '../components/BrandNav';

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

interface BookingUpdate {
  id: string;
  courtName: string;
  venueName: string;
  customerName: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVenues: 0,
    approvedVenues: 0,
    pendingVenues: 0,
    totalBookings: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    if (user?.role !== 'OWNER') {
      navigate('/');
      return;
    }
    fetchOwnerData();
  }, [user, navigate]);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch owner venues
      const venuesResponse = await api.get('/facilities/my-venues');
      const venuesData = (venuesResponse.data as any)?.data || [];
      setVenues(venuesData);

      // Calculate stats
      const approved = venuesData.filter((v: Venue) => v.status === 'APPROVED').length;
      const pending = venuesData.filter((v: Venue) => v.status === 'PENDING').length;
      
      setStats(prev => ({
        ...prev,
        totalVenues: venuesData.length,
        approvedVenues: approved,
        pendingVenues: pending
      }));

      // Mock recent bookings for now
      setRecentBookings([
        {
          id: '1',
          courtName: 'Tennis Court 1',
          venueName: 'Elite Sports Complex',
          customerName: 'John Doe',
          startTime: '2025-08-11T10:00:00Z',
          endTime: '2025-08-11T11:00:00Z',
          status: 'CONFIRMED',
          totalAmount: 50,
          createdAt: '2025-08-11T09:30:00Z'
        },
        {
          id: '2',
          courtName: 'Basketball Court A',
          venueName: 'Sports Arena',
          customerName: 'Jane Smith',
          startTime: '2025-08-11T14:00:00Z',
          endTime: '2025-08-11T15:30:00Z',
          status: 'PENDING',
          totalAmount: 75,
          createdAt: '2025-08-11T13:15:00Z'
        }
      ]);

    } catch (error) {
      console.error('Error fetching owner data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-300'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO title="Owner Dashboard - QuickCourt" description="Manage your sports venues and bookings" />
        <BrandNav />
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Owner Dashboard - QuickCourt" description="Manage your sports venues and bookings" />
      <BrandNav />
      
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-gray-600">Manage your venues and track your bookings</p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Ready to expand your business?</h3>
                    <p className="text-green-100 mb-4">
                      List your sports facility and start earning from bookings today.
                    </p>
                    <Button 
                      onClick={() => navigate('/manage-venues')}
                      className="bg-white text-green-600 hover:bg-gray-100"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create New Listing
                    </Button>
                  </div>
                  <div className="hidden md:block">
                    <HomeIcon className="w-24 h-24 text-green-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Venues</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalVenues}</p>
                  </div>
                  <HomeIcon className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approvedVenues}</p>
                  </div>
                  <TrendingUpIcon className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingVenues}</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalBookings}</p>
                  </div>
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Venues */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">My Venues</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/manage-venues')}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {venues.length === 0 ? (
                  <div className="text-center py-8">
                    <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No venues yet</h3>
                    <p className="text-gray-600 mb-4">Create your first venue listing to start earning.</p>
                    <Button 
                      onClick={() => navigate('/manage-venues')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Create Venue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {venues.slice(0, 3).map((venue) => (
                      <div key={venue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{venue.name}</h4>
                            {getStatusBadge(venue.status)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            {venue.location}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {venue.courts.length} courts • Created {new Date(venue.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/venues/${venue.id}`)}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/manage-venues')}
                          >
                            <EditIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Booking Updates */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <BellIcon className="w-5 h-5 mr-2" />
                  Recent Booking Updates
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-600">Once your venues are approved, bookings will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                            <p className="text-sm text-gray-600">
                              {booking.courtName} • {booking.venueName}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {new Date(booking.startTime).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Booked {new Date(booking.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center text-green-600 font-medium">
                            <DollarSignIcon className="w-4 h-4 mr-1" />
                            ${booking.totalAmount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center text-center"
                onClick={() => navigate('/manage-venues')}
              >
                <PlusIcon className="w-8 h-8 mb-2 text-green-600" />
                <span className="font-medium">Add New Venue</span>
                <span className="text-sm text-gray-500">List another property</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center text-center"
                onClick={() => navigate('/manage-venues')}
              >
                <EditIcon className="w-8 h-8 mb-2 text-blue-600" />
                <span className="font-medium">Manage Venues</span>
                <span className="text-sm text-gray-500">Edit existing properties</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center text-center"
              >
                <TrendingUpIcon className="w-8 h-8 mb-2 text-purple-600" />
                <span className="font-medium">View Analytics</span>
                <span className="text-sm text-gray-500">Track performance</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
