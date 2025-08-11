import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from "@/components/SEO";
import BrandNav from "@/components/BrandNav";
import VenueCard, { Venue } from "@/components/VenueCard";
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

const venues: Venue[] = [
  { id: '1', name: 'Central Park Courts', sport: 'tennis', pricePerHour: 25, rating: 4.7, location: 'New York, NY' },
  { id: '2', name: 'Harbor Badminton Hub', sport: 'badminton', pricePerHour: 18, rating: 4.6, location: 'India, CA' },
  { id: '3', name: 'Downtown Hoops', sport: 'basketball', pricePerHour: 30, rating: 4.8, location: 'Los Angeles, CA' },
  { id: '4', name: 'Riverside Soccer Arena', sport: 'soccer', pricePerHour: 28, rating: 4.5, location: 'Austin, TX' },
  { id: '5', name: 'Elite Squash Center', sport: 'squash', pricePerHour: 22, rating: 4.4, location: 'Chicago, IL' },
  { id: '6', name: 'City Volleyball Courts', sport: 'volleyball', pricePerHour: 20, rating: 4.3, location: 'Seattle, WA' },
  { id: '7', name: 'Premier Tennis Club', sport: 'tennis', pricePerHour: 35, rating: 4.9, location: 'Miami, FL' },
  { id: '8', name: 'Phoenix Basketball Center', sport: 'basketball', pricePerHour: 26, rating: 4.2, location: 'Phoenix, AZ' },
  { id: '9', name: 'Metro Badminton Hall', sport: 'badminton', pricePerHour: 16, rating: 4.1, location: 'Denver, CO' },
  { id: '10', name: 'Olympic Training Facility', sport: 'tennis', pricePerHour: 40, rating: 4.8, location: 'Boston, MA' },
];

const sports = ['tennis', 'basketball', 'badminton', 'soccer', 'squash', 'volleyball'];
const cities = [...new Set(venues.map(v => v.location))].sort();

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

  // Initialize from URL params
  useEffect(() => {
    const locationParam = searchParams.get('location');
    if (locationParam) {
      setSearchTerm(locationParam);
    }
  }, [searchParams]);

  // Filter and sort venues
  const filteredVenues = useMemo(() => {
    let filtered = venues.filter((venue) => {
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !venue.name.toLowerCase().includes(term) &&
          !venue.location.toLowerCase().includes(term) &&
          !venue.sport.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      // Sports filter
      if (selectedSports.length > 0 && !selectedSports.includes(venue.sport)) {
        return false;
      }

      // City filter
      if (selectedCity && venue.location !== selectedCity) {
        return false;
      }

      // Price range filter
      if (venue.pricePerHour < priceRange[0] || venue.pricePerHour > priceRange[1]) {
        return false;
      }

      // Rating filter
      if (venue.rating < minRating) {
        return false;
      }

      return true;
    });

    // Sort venues
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.pricePerHour - b.pricePerHour);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.pricePerHour - a.pricePerHour);
        break;
      case 'rating':
      default:
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    return filtered;
  }, [searchTerm, selectedSports, selectedCity, priceRange, minRating, sortBy]);

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
                        {cities.map((city) => (
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
                  <VenueCard key={venue.id} venue={venue} />
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
