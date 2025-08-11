import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SEO from "@/components/SEO";
import BrandNav from "@/components/BrandNav";
import VenueCard, { Venue } from "@/components/VenueCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  MapPin, 
  Filter, 
  SlidersHorizontal,
  Star,
  Map,
  List
} from 'lucide-react';
import { facilitiesApi } from '@/lib/api';

const sports = ['tennis', 'basketball', 'badminton', 'soccer', 'squash', 'volleyball'];

const Venues = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('location') || '');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 50]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch venues from API
  const { data: venuesData, isLoading, error } = useQuery({
    queryKey: ['venues'],
    queryFn: () => facilitiesApi.list({ pageSize: 100 }),
  });

  const venues = venuesData?.items || [];

  // Convert Facility to Venue format
  const convertFacilityToVenue = (facility: any): Venue => ({
    id: facility.id,
    name: facility.name,
    location: facility.location,
    images: facility.images.length > 0 ? facility.images : ['/placeholder.svg'],
    sports: facility.sports,
    pricePerHour: facility.courts?.[0]?.pricePerHour || 0,
    rating: Math.random() * 2 + 3.5,
    reviewCount: Math.floor(Math.random() * 100) + 10,
    amenities: facility.amenities,
    type: Math.random() > 0.5 ? 'indoor' : 'outdoor',
    isVerified: facility.status === 'APPROVED'
  });

  // Extract unique cities from venues data
  const cities = useMemo(() => {
    return [...new Set(venues.map((facility: any) => facility.location))].sort();
  }, [venues]);

  // Filter and sort venues based on current criteria
  const filteredVenues = useMemo(() => {
    const convertedVenues = venues.map(convertFacilityToVenue);
    let filtered = [...convertedVenues];

    if (searchTerm) {
      filtered = filtered.filter((venue: Venue) =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSports.length > 0) {
      filtered = filtered.filter((venue: Venue) =>
        selectedSports.some(sport => 
          venue.sports.some(venueSport => 
            venueSport.toLowerCase().includes(sport.toLowerCase())
          )
        )
      );
    }

    if (selectedCity) {
      filtered = filtered.filter((venue: Venue) =>
        venue.location.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    filtered = filtered.filter((venue: Venue) => {
      const price = venue.pricePerHour || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (minRating > 0) {
      filtered = filtered.filter((venue: Venue) => 
        venue.rating >= minRating
      );
    }

    filtered.sort((a: Venue, b: Venue) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.pricePerHour - b.pricePerHour;
        case 'price-high':
          return b.pricePerHour - a.pricePerHour;
        case 'rating':
        default:
          return b.rating - a.rating;
      }
    });

    return filtered;
  }, [venues, searchTerm, selectedSports, selectedCity, priceRange, minRating, sortBy]);

  // Initialize from URL params
  useEffect(() => {
    const locationParam = searchParams.get('location');
    if (locationParam) {
      setSearchTerm(locationParam);
    }
  }, [searchParams]);

  const handleSportFilter = (sport: string, checked: boolean) => {
    if (checked) {
      setSelectedSports(prev => [...prev, sport]);
    } else {
      setSelectedSports(prev => prev.filter(s => s !== sport));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSports([]);
    setSelectedCity('');
    setPriceRange([0, 50]);
    setMinRating(0);
    setSortBy('rating');
    setSearchParams({});
  };

  const activeFiltersCount = 
    (searchTerm ? 1 : 0) +
    selectedSports.length +
    (selectedCity ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 50 ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-[72px]">
        <SEO title="Sports Venues - QuickCourt" description="Find and book sports facilities near you" />
        <BrandNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading venues...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background pt-[72px]">
        <SEO title="Sports Venues - QuickCourt" description="Find and book sports facilities near you" />
        <BrandNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">Failed to load venues</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no venues available
  if (!venues || venues.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-[72px]">
        <SEO title="Sports Venues - QuickCourt" description="Find and book sports facilities near you" />
        <BrandNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Venues Available</h2>
              <p className="text-gray-600 mb-4">
                There are no sports venues available at the moment. Please check back later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[72px]">
      <SEO title="Find Sports Venues – QuickCourt" description="Browse all nearby sports facilities and check live availability." path="/venues" />
      <BrandNav />
      
      <main className="container mx-auto px-4 py-6 sm:py-8 md:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Find Sports Venues</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Discover and book the perfect court for your next game</p>
        </div>

        {/* Search and Controls */}
        <div className="mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by venue name, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-auto"
                  />
                </div>

                {/* Sort and Filters - Mobile */}
                <div className="flex gap-2 sm:contents">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Sort by Rating</SelectItem>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filters Toggle */}
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="relative flex-shrink-0"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>

                  {/* View Toggle - Desktop Only */}
                  <div className="hidden sm:flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none border-r"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('map')}
                      className="rounded-none"
                    >
                      <Map className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Advanced Filters</span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sports Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Sports</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {sports.map((sport) => (
                    <div key={sport} className="flex items-center space-x-2">
                      <Checkbox
                        id={sport}
                        checked={selectedSports.includes(sport)}
                        onCheckedChange={(checked) => handleSportFilter(sport, checked as boolean)}
                      />
                      <Label htmlFor={sport} className="text-sm capitalize cursor-pointer">
                        {sport}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* City Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Price Range: ₹{priceRange[0]} - ₹{priceRange[1]} per hour
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Rating Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Minimum Rating: {minRating > 0 ? `${minRating}+ stars` : 'Any rating'}
                </Label>
                <Slider
                  value={[minRating]}
                  onValueChange={(value) => setMinRating(value[0])}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        <div className="space-y-4 sm:space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredVenues.length} {filteredVenues.length === 1 ? 'venue' : 'venues'} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          {/* Venues Grid/List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVenues.length > 0 ? (
              filteredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No venues found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms to find more venues.
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Venues;
