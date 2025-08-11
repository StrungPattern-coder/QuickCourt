import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, PlusCircle, BarChart3, Calendar, Trophy, Building, MapPin, Clock, DollarSign, Users } from 'lucide-react';
import SEO from '@/components/SEO';
import AddCourtForm from '@/components/AddCourtForm';
import { courtsApi } from '@/lib/api';
import { toast } from 'sonner';

const OwnerDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (user.role !== 'OWNER') {
        navigate('/', { replace: true });
      } else {
        fetchOwnerCourts();
      }
    }
  }, [user, isLoading, navigate]);

  const fetchOwnerCourts = async () => {
    try {
      setLoading(true);
      const ownerCourts = await courtsApi.getOwnerCourts();
      setCourts(ownerCourts);
    } catch (error) {
      console.error('Failed to fetch courts:', error);
      toast.error('Failed to load your courts');
    } finally {
      setLoading(false);
    }
  };

  const handleCourtAdded = () => {
    setShowAddForm(false);
    setActiveTab('overview');
    fetchOwnerCourts();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REJECTED': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading || !user || user.role !== 'OWNER') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO title="Add Court - Owner Dashboard" description="Add a new court to your facility" path="/owner/dashboard" />
        <AddCourtForm 
          onCourtAdded={handleCourtAdded}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="Owner Dashboard - QuickCourt" description="Manage your facilities and courts" path="/owner/dashboard" />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <Button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Court
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courts">My Courts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {courts.filter(c => c.facility.status === 'APPROVED').length} approved
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courts.reduce((sum, court) => sum + court._count.bookings, 0)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${courts.length > 0 
                    ? (courts.reduce((sum, court) => sum + Number(court.pricePerHour), 0) / courts.length).toFixed(0)
                    : '0'}/hr
                </div>
                <p className="text-xs text-muted-foreground">Per hour rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant="default">Active Owner</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {courts.filter(c => c.facility.status === 'PENDING').length} pending approval
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="h-20 flex-col gap-2"
                  variant="outline"
                >
                  <PlusCircle className="h-6 w-6" />
                  Add New Court
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('courts')}
                  className="h-20 flex-col gap-2"
                  variant="outline"
                >
                  <Building className="h-6 w-6" />
                  Manage Courts
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('analytics')}
                  className="h-20 flex-col gap-2"
                  variant="outline"
                >
                  <BarChart3 className="h-6 w-6" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>My Courts</span>
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Court
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading courts...</p>
                </div>
              ) : courts.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No courts added yet</p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Court
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Court Details</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bookings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courts.map((court) => (
                      <TableRow key={court.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{court.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {court.id.slice(-8)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{court.facility.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {court.facility.location}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="font-medium">${Number(court.pricePerHour)}/hr</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {formatTime(court.openTime)} - {formatTime(court.closeTime)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(court.facility.status)}>
                            {court.facility.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{court._count.bookings}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">Revenue analytics</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Court</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courts.length > 0 
                    ? courts.reduce((prev, curr) => 
                        prev._count.bookings > curr._count.bookings ? prev : curr
                      ).name
                    : '—'}
                </div>
                <p className="text-xs text-muted-foreground">Most popular</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">📈</div>
                <p className="text-xs text-muted-foreground">Analytics coming soon</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Detailed analytics and insights will be available soon. This will include:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Booking trends and patterns</li>
                  <li>Revenue analytics</li>
                  <li>Peak hours analysis</li>
                  <li>Customer demographics</li>
                  <li>Performance comparisons</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboard; 