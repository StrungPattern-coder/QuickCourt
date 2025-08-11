import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, ChevronDown, Star, ArrowRight, Users, Clock, Trophy, Play, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { facilitiesApi } from '@/lib/api';
import BrandNav from '@/components/BrandNav';
import VenueCard from '@/components/VenueCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import SEO from '@/components/SEO';

interface Venue {
  id: string;
  name: string;
  location: string;
  sport: string;
  rating: number;
  pricePerHour: number;
}

interface Sport {
  id: string;
  name: string;
  icon: string;
  image: string;
  venueCount: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [topRatedVenues, setTopRatedVenues] = useState<Venue[]>([]);
  const [popularSports, setPopularSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  // Mock data - replace with API calls in production
  const mockSports: Sport[] = [
    { id: '1', name: 'Badminton', icon: '🏸', image: '/placeholder.svg', venueCount: 45 },
    { id: '2', name: 'Tennis', icon: '🎾', image: '/placeholder.svg', venueCount: 32 },
    { id: '3', name: 'Football', icon: '⚽', image: '/placeholder.svg', venueCount: 28 },
    { id: '4', name: 'Cricket', icon: '🏏', image: '/placeholder.svg', venueCount: 24 },
    { id: '5', name: 'Basketball', icon: '🏀', image: '/placeholder.svg', venueCount: 18 },
    { id: '6', name: 'Table Tennis', icon: '🏓', image: '/placeholder.svg', venueCount: 15 },
    { id: '7', name: 'Squash', icon: '🎾', image: '/placeholder.svg', venueCount: 12 },
    { id: '8', name: 'Swimming', icon: '🏊', image: '/placeholder.svg', venueCount: 8 }
  ];

  const mockVenues: Venue[] = [
    { id: '1', name: 'Elite Sports Complex', location: 'Bandra West, Mumbai', sport: 'Badminton', rating: 4.8, pricePerHour: 500 },
    { id: '2', name: 'SportZone Arena', location: 'Andheri East, Mumbai', sport: 'Football', rating: 4.7, pricePerHour: 400 },
    { id: '3', name: 'Court Masters', location: 'Powai, Mumbai', sport: 'Tennis', rating: 4.6, pricePerHour: 600 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace with actual API calls
        setPopularSports(mockSports);
        setTopRatedVenues(mockVenues);
      } catch (error) {
        console.error('Error fetching data:', error);
        setPopularSports(mockSports);
        setTopRatedVenues(mockVenues);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (selectedSport) params.append('sport', selectedSport);
    if (selectedDate) params.append('date', selectedDate);
    
    navigate(`/venues?${params.toString()}`);
  };

  const handleSportClick = (sportName: string) => {
    navigate(`/venues?sport=${encodeURIComponent(sportName)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="QuickCourt - Book Sports Facilities Near You"
        description="Choose a sport, find a court, and start playing. Book badminton, tennis, football and more courts instantly."
      />
      
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-50">
        <BrandNav />
      </div>

      {/* Hero Search Banner */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70 z-10"></div>
          <div className="w-full h-full bg-gradient-to-br from-green-600 via-green-500 to-green-400">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <motion.div 
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              />
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center text-white px-4 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Book Sports Facilities
              <span className="block text-green-400">Near You</span>
            </h1>
            
            <motion.p
              className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Choose a sport, find a court, and start playing
            </motion.p>

            {/* Search Bar - Playo Style */}
            <motion.div
              className="bg-white rounded-2xl p-4 md:p-6 max-w-5xl mx-auto shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Location */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Enter location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-10 h-14 text-gray-900 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
                  />
                </div>

                {/* Sport Selection */}
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger className="h-14 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularSports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.name}>
                        <span className="flex items-center gap-2">
                          <span>{sport.icon}</span>
                          {sport.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 h-14 text-gray-900 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
                  />
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="h-14 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="h-8 w-8 text-white/70" />
          </motion.div>
        </div>
      </section>

      {/* Sports Categories Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Sport
            </h2>
            <p className="text-xl text-gray-600">
              Browse by sport and find the perfect venue
            </p>
          </motion.div>

          {/* Horizontal Scrollable Sports */}
          <motion.div
            className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {popularSports.map((sport) => (
              <motion.div
                key={sport.id}
                className="flex-shrink-0 w-32 md:w-40"
                variants={fadeInUp}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200"
                  onClick={() => handleSportClick(sport.name)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{sport.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-1">{sport.name}</h3>
                    <p className="text-sm text-gray-500">{sport.venueCount} venues</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Top Rated Venues Near You
            </h2>
            <p className="text-xl text-gray-600">
              Discover highly-rated sports facilities in your area
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {topRatedVenues.map((venue) => (
                <motion.div key={venue.id} variants={fadeInUp}>
                  <VenueCard venue={venue} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            className="text-center mt-12"
            {...fadeInUp}
          >
            <Button
              onClick={() => navigate('/venues')}
              size="lg"
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 px-8 py-3 rounded-xl font-semibold"
            >
              View All Venues
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Join Community Banner */}
      <section className="py-20 bg-green-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center text-white"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Join Thousands of Players and Facility Owners
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Become part of India's largest sports community. Play, connect, and grow together.
            </p>
            <Button
              onClick={() => navigate('/signup')}
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Users className="h-6 w-6 mr-2" />
              Sign Up for Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get on the field in 3 simple steps
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                step: "1",
                icon: <Search className="h-10 w-10" />,
                title: "Search",
                description: "Find sports facilities near you by location, sport, and availability"
              },
              {
                step: "2", 
                icon: <Calendar className="h-10 w-10" />,
                title: "Book",
                description: "Select your preferred time slot and complete secure online payment"
              },
              {
                step: "3",
                icon: <Play className="h-10 w-10" />,
                title: "Play",
                description: "Show up and enjoy your game at the booked facility"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center relative"
                variants={fadeInUp}
              >
                <div className="bg-green-500 text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-10 -right-6 h-8 w-8 text-green-400" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { number: "500+", label: "Sports Venues", icon: <Trophy className="h-8 w-8 text-green-500 mx-auto mb-2" /> },
              { number: "10K+", label: "Happy Players", icon: <Users className="h-8 w-8 text-green-500 mx-auto mb-2" /> },
              { number: "25+", label: "Cities", icon: <MapPin className="h-8 w-8 text-green-500 mx-auto mb-2" /> },
              { number: "4.8★", label: "Average Rating", icon: <Star className="h-8 w-8 text-green-500 mx-auto mb-2" /> }
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeInUp} className="p-6">
                {stat.icon}
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
