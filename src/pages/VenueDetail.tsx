import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import BrandNav from "@/components/BrandNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  MapPin, 
  Clock, 
  Star, 
  Wifi, 
  Car, 
  Bath, 
  Users,
  Play,
  DollarSign
} from "lucide-react";
import { facilitiesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Mock data for development
const mockVenue = {
  id: '1',
  name: 'Central Park Courts',
  location: '123 Park Avenue, New York, NY 10001',
  description: 'Premier tennis facility in the heart of Manhattan with state-of-the-art courts and professional coaching services. Our facility features multiple indoor and outdoor courts suitable for all skill levels.',
  sports: ['tennis', 'badminton', 'squash'],
  amenities: ['parking', 'wifi', 'shower', 'locker', 'coaching', 'equipment-rental'],
  images: [
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526676037777-05a232c1f1e6?w=800&h=400&fit=crop',
  ],
  status: 'APPROVED' as const,
  ownerId: 'owner1',
  courts: [
    {
      id: 'court1',
      name: 'Court 1 - Professional',
      facilityId: '1',
      pricePerHour: 25,
      openTime: 360, // 6 AM in minutes
      closeTime: 1320, // 10 PM in minutes
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'court2',
      name: 'Court 2 - Training',
      facilityId: '1',
      pricePerHour: 20,
      openTime: 360,
      closeTime: 1320,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  rating: 4.8,
  reviewCount: 124,
  reviews: [
    {
      id: '1',
      userName: 'John Smith',
      rating: 5,
      comment: 'Excellent facility with well-maintained courts. Great location and friendly staff.',
      date: '2024-01-15'
    },
    {
      id: '2', 
      userName: 'Sarah Johnson',
      rating: 4,
      comment: 'Good courts but can get crowded during peak hours. Overall great experience.',
      date: '2024-01-10'
    }
  ]
};

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // In a real app, this would fetch from the API
  // const { data: venue, isLoading } = useQuery({
  //   queryKey: ['venue', id],
  //   queryFn: () => facilitiesApi.getById(id!),
  // });

  const venue = mockVenue; // Using mock data for now
  const isLoading = false;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'parking': return <Car className="h-4 w-4" />;
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'shower': return <Bath className="h-4 w-4" />;
      case 'locker': return <Users className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getSportIcon = (sport: string) => {
    return <Play className="h-4 w-4" />;
  };

  const handleBookCourt = (courtId: string) => {
    navigate(`/book/${venue.id}/${courtId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNav />
        <main className="container mx-auto px-4 py-10">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg mb-8"></div>
            <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNav />
        <main className="container mx-auto px-4 py-10">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p>Venue not found.</p>
              <Button className="mt-4" onClick={() => navigate('/venues')}>
                Back to Venues
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${venue.name} - QuickCourt`} 
        description={venue.description} 
        path={`/venue/${venue.id}`} 
      />
      <BrandNav />
      
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{venue.name}</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{venue.rating}</span>
              <span className="text-muted-foreground">({venue.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {venue.location}
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          <Carousel className="w-full">
            <CarouselContent>
              {venue.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                    <img
                      src={image}
                      alt={`${venue.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About the Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {venue.description}
                </p>
              </CardContent>
            </Card>

            {/* Sports Available */}
            <Card>
              <CardHeader>
                <CardTitle>Sports Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.sports.map((sport) => (
                    <Popover key={sport}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start h-auto p-4">
                          <div className="flex items-center gap-3">
                            {getSportIcon(sport)}
                            <div>
                              <p className="font-semibold capitalize">{sport}</p>
                              <p className="text-sm text-muted-foreground">Click for pricing</p>
                            </div>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-3">
                          <h4 className="font-semibold capitalize">{sport} Courts</h4>
                          {venue.courts.map((court) => (
                            <div key={court.id} className="flex justify-between items-center p-3 border rounded">
                              <div>
                                <p className="font-medium">{court.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatTime(court.openTime)} - {formatTime(court.closeTime)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${court.pricePerHour}/hr</p>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleBookCourt(court.id)}
                                  className="mt-1"
                                >
                                  Book Now
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      {getAmenityIcon(amenity)}
                      <span className="capitalize">{amenity.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {venue.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{review.userName}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Book This Venue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price from:</span>
                    <p className="font-semibold">${Math.min(...venue.courts.map(c => c.pricePerHour))}/hour</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Operating Hours:</span>
                    <p className="font-semibold">
                      {formatTime(venue.courts[0].openTime)} - {formatTime(venue.courts[0].closeTime)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold">Available Courts</h4>
                  {venue.courts.map((court) => (
                    <Button
                      key={court.id}
                      variant="outline"
                      className="w-full justify-between h-auto p-3"
                      onClick={() => handleBookCourt(court.id)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{court.name}</p>
                        <p className="text-sm text-muted-foreground">${court.pricePerHour}/hour</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Book
                      </div>
                    </Button>
                  ))}
                </div>

                <Button className="w-full" size="lg">
                  Book Any Available Court
                </Button>

                <div className="text-center text-sm text-muted-foreground">
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

export default VenueDetail;
