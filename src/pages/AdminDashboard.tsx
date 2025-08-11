import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Eye,
  Check,
  X,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  MapPin,
  Star,
  Clock,
  Ban,
  CheckCircle
} from 'lucide-react';
import { api, adminApi } from '@/lib/api';
import { AdminNotifications } from '@/components/AdminNotifications';

interface DashboardStats {
  totalUsers: number;
  totalFacilities: number;
  totalBookings: number;
  totalRevenue: number;
  pendingFacilities: number;
  activeBookings: number;
  usersLastMonth: number;
  revenueLastMonth: number;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  _count: {
    bookings: number;
    facilities: number;
  };
}

interface Facility {
  id: string;
  name: string;
  description: string;
  location: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  images: string[];
  sports: string[];
  amenities: string[];
  owner?: {
    id: string;
    fullName: string;
    email?: string;
  };
  createdAt: string;
  _count?: {
    bookings?: number;
    courts?: number;
  };
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  facility: {
    id: string;
    name: string;
    location: string;
  };
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [facilityStatusFilter, setFacilityStatusFilter] = useState('all');
  const [bookingFilter, setBookingFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, facilitiesRes, bookingsRes] = await Promise.all([
        adminApi.getStats(),
        api.get<User[]>('/admin/users'),
        adminApi.getFacilities(),
        api.get<Booking[]>('/admin/bookings')
      ]);

      setStats(statsRes);
      setUsers(usersRes.data);
      setFacilities(facilitiesRes.items);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveFacility = async (facilityId: string) => {
    try {
      await adminApi.approveFacility(facilityId);
      toast.success('Facility approved successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve facility:', error);
      toast.error('Failed to approve facility');
    }
  };

  const rejectFacility = async (facilityId: string, reason: string) => {
    try {
      await adminApi.rejectFacility(facilityId, reason);
      toast.success('Facility rejected');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to reject facility:', error);
      toast.error('Failed to reject facility');
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { reason });
      toast.success('User banned successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Failed to ban user');
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/unban`);
      toast.success('User unbanned successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to unban user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(userFilter.toLowerCase()) ||
                         user.email.toLowerCase().includes(userFilter.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(facilityFilter.toLowerCase()) ||
                         facility.location.toLowerCase().includes(facilityFilter.toLowerCase());
    const matchesStatus = facilityStatusFilter === 'all' || facility.status === facilityStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.user.fullName.toLowerCase().includes(bookingFilter.toLowerCase()) ||
                         booking.facility.name.toLowerCase().includes(bookingFilter.toLowerCase());
    const matchesStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <AdminNotifications />
          <Button onClick={fetchDashboardData} variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stats.usersLastMonth} new this month
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalFacilities}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingFacilities} pending approval
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBookings}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeBookings} active bookings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="inline-flex items-center text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        ${stats.revenueLastMonth} this month
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New facility submitted</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">User registration spike</p>
                          <p className="text-xs text-muted-foreground">4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Payment issue reported</p>
                          <p className="text-xs text-muted-foreground">6 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="mr-2 h-4 w-4" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">User Roles</span>
                        <div className="flex space-x-2">
                          <Badge variant="secondary">
                            {users.filter(u => u.role === 'USER').length} Users
                          </Badge>
                          <Badge variant="outline">
                            {users.filter(u => u.role === 'OWNER').length} Owners
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Facility Status</span>
                        <div className="flex space-x-2">
                          <Badge variant="default">
                            {facilities.filter(f => f.status === 'APPROVED').length} Approved
                          </Badge>
                          <Badge variant="destructive">
                            {facilities.filter(f => f.status === 'PENDING').length} Pending
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Booking Status</span>
                        <div className="flex space-x-2">
                          <Badge variant="default">
                            {bookings.filter(b => b.status === 'CONFIRMED').length} Confirmed
                          </Badge>
                          <Badge variant="secondary">
                            {bookings.filter(b => b.status === 'PENDING').length} Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users..."
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="USER">Users</SelectItem>
                    <SelectItem value="OWNER">Owners</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'OWNER' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user._count.bookings}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {user.status === 'ACTIVE' ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ban User</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>Are you sure you want to ban {user.fullName}?</p>
                                  <Textarea placeholder="Reason for banning..." />
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline">Cancel</Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => banUser(user.id, 'Admin action')}
                                    >
                                      Ban User
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => unbanUser(user.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Facility Management</CardTitle>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search facilities..."
                    value={facilityFilter}
                    onChange={(e) => setFacilityFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={facilityStatusFilter} onValueChange={setFacilityStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sports</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{facility.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {facility.location}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{facility.owner.fullName}</p>
                          <p className="text-sm text-muted-foreground">{facility.owner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          facility.status === 'APPROVED' ? 'default' : 
                          facility.status === 'PENDING' ? 'secondary' : 'destructive'
                        }>
                          {facility.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {facility.sports?.join(', ') || 'General'}
                      </TableCell>
                      <TableCell>{facility._count?.bookings || 0}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {facility.status === 'PENDING' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => approveFacility(facility.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Facility</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p>Reject {facility.name}?</p>
                                    <Textarea placeholder="Reason for rejection..." />
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline">Cancel</Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => rejectFacility(facility.id, 'Quality standards not met')}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{facility.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold">Location</h4>
                                    <p className="text-sm text-muted-foreground">{facility.location}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Sports</h4>
                                    <p className="text-sm text-muted-foreground">{facility.sports?.join(', ') || 'General'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Description</h4>
                                  <p className="text-sm text-muted-foreground">{facility.description}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Images</h4>
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    {facility.images.slice(0, 3).map((image, idx) => (
                                      <img 
                                        key={idx}
                                        src={image}
                                        alt={`${facility.name} ${idx + 1}`}
                                        className="w-full h-20 object-cover rounded"
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search bookings..."
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <p className="font-medium">#{booking.id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{booking.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.facility.name}</p>
                          <p className="text-sm text-muted-foreground">{booking.facility.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <div>
                            <p className="text-sm">
                              {new Date(booking.startTime).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          booking.status === 'CONFIRMED' ? 'default' : 
                          booking.status === 'PENDING' ? 'secondary' : 
                          booking.status === 'COMPLETED' ? 'default' : 'destructive'
                        }>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${booking.totalPrice}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
