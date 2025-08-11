import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SEO from "@/components/SEO";
import BrandNav from "@/components/BrandNav";
import FacilityCard from "@/components/FacilityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    queryFn: () => facilitiesApi.getAll(),
  });

  const venues = venuesData?.items || [];

  // Extract unique cities from venues data
  const cities = useMemo(() => {
    return [...new Set(venues.map((v: any) => v.location))].sort();
  }, [venues]);

  // Initialize from URL params
  useEffect(() => {
    const locationParam = searchParams.get('location');
    if (locationParam) {
      setSearchTerm(locationParam);
    }
  }, [searchParams]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
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

  // Filter and search venues
  const filteredVenues = useMemo(() => {
    let filtered = [...venues];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((venue: any) =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.sports.some((sport: string) => sport.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by selected sports
    if (selectedSports.length > 0) {
      filtered = filtered.filter((venue: any) =>
        selectedSports.some(sport => venue.sports.includes(sport))
      );
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter((venue: any) =>
        venue.location.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filter by price range
    if (priceRange[0] > 0 || priceRange[1] < 50) {
      filtered = filtered.filter((venue: any) => {
        if (!venue.priceRange) return false;
        return venue.priceRange.min >= priceRange[0] && venue.priceRange.max <= priceRange[1];
      });
    }

    // Sort venues
    switch (sortBy) {
      case 'name':
        filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a: any, b: any) => (a.priceRange?.min || 0) - (b.priceRange?.min || 0));
        break;
      case 'price-high':
        filtered.sort((a: any, b: any) => (b.priceRange?.max || 0) - (a.priceRange?.max || 0));
        break;
      default:
        // Default sort by creation date (newest first)
        filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [venues, searchTerm, selectedSports, selectedCity, priceRange, minRating, sortBy]);

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

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Find Sports Venues – QuickCourt" description="Browse all nearby sports facilities and check live availability." path="/venues" />
      <BrandNav />
      
      <main className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Sports Venues</h1>
          <p className="text-muted-foreground">Discover and book the perfect court for your next game</p>
        </div>

        {/* Search and Controls */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by venue name, location, or sport..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
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
                  className="relative"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* View Mode Toggle */}
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="rounded-l-none"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Filters</CardTitle>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sports Filter */}
                  <div>
                    <h4 className="font-semibold mb-3">Sports</h4>
                    <div className="space-y-2">
                      {sports.map((sport) => (
                        <div key={sport} className="flex items-center space-x-2">
                          <Checkbox
                            id={sport}
                            checked={selectedSports.includes(sport)}
                            onCheckedChange={(checked) => handleSportFilter(sport, checked as boolean)}
                          />
                          <label htmlFor={sport} className="text-sm capitalize cursor-pointer">
                            {sport}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* City Filter */}
                  <div>
                    <h4 className="font-semibold mb-3">Location</h4>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="All cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All cities</SelectItem>
                        {cities.map((city: string) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Price Range Filter */}
                  <div>
                    <h4 className="font-semibold mb-3">Price per Hour</h4>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={50}
                        step={5}
                        className="mb-4"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Rating Filter */}
                  <div>
                    <h4 className="font-semibold mb-3">Minimum Rating</h4>
                    <div className="space-y-2">
                      {[4, 3, 2, 1, 0].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={minRating === rating}
                            onCheckedChange={(checked) => setMinRating(checked ? rating : 0)}
                          />
                          <label htmlFor={`rating-${rating}`} className="flex items-center gap-1 text-sm cursor-pointer">
                            {rating > 0 ? (
                              <>
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {rating}+ stars
                              </>
                            ) : (
                              'Any rating'
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-muted-foreground">
                  Showing {filteredVenues.length} of {venues.length} venues
                </p>
              </div>
              
              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {searchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchTerm}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSearchTerm('')}
                      >
                        ×
                      </Button>
                    </Badge>
                  )}
                  {selectedSports.map((sport) => (
                    <Badge key={sport} variant="secondary" className="gap-1 capitalize">
                      {sport}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleSportFilter(sport, false)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                  {selectedCity && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedCity}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedCity('')}
                      >
                        ×
                      </Button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Venue Grid */}
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVenues.map((venue) => (
                  <FacilityCard key={venue.id} venue={venue} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Map View Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    We're working on an interactive map to help you visualize venue locations.
                  </p>
                  <Button onClick={() => setViewMode('list')}>
                    Switch to List View
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {filteredVenues.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
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
