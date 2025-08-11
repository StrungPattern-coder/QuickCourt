import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandNav from "@/components/BrandNav";
import BackgroundGlow from "@/components/BackgroundGlow";
import Hero from "@/components/Hero";
import CourtsCarousel from "@/components/CourtsCarousel";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Shield, 
  Star, 
  Users,
  Smartphone,
  CreditCard,
  Trophy,
  Target,
  Zap
} from 'lucide-react';

const sports = [
  { name: 'Tennis', icon: '🎾', count: '1,200+ courts' },
  { name: 'Badminton', icon: '🏸', count: '800+ courts' },
  { name: 'Basketball', icon: '🏀', count: '600+ courts' },
  { name: 'Squash', icon: '🟩', count: '400+ courts' },
  { name: 'Volleyball', icon: '🏐', count: '300+ courts' },
  { name: 'Pickleball', icon: '🏓', count: '250+ courts' },
];

const features = [
  {
    icon: Clock,
    title: 'Real-time Availability',
    description: 'See live court availability and book instantly without calling ahead'
  },
  {
    icon: Smartphone,
    title: 'Easy Mobile Booking',
    description: 'Book courts on-the-go with our mobile-first platform'
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Safe and secure payment processing with full refund protection'
  },
  {
    icon: CreditCard,
    title: 'Flexible Cancellation',
    description: 'Free cancellation up to 30 minutes before your booking time'
  },
  {
    icon: Star,
    title: 'Verified Reviews',
    description: 'Read authentic reviews from real players to choose the best courts'
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Connect with other players and discover local sports communities'
  }
];

const Index = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      navigate(`/venues?location=${encodeURIComponent(searchLocation.trim())}`);
    } else {
      navigate('/venues');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="QuickCourt – Real-time Sports Court Booking" description="Search, discover, and book courts with live availability and instant updates." path="/" />
      <BackgroundGlow>
        <BrandNav />
        <main>
          <Hero />
          
          {/* Enhanced Search Section */}
          <section className="container mx-auto px-4 -mt-8 relative z-10 mb-16">
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex gap-3">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter city or venue name..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" className="px-8">
                    <Search className="h-4 w-4 mr-2" />
                    Search Courts
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Sports Categories */}
          <section className="container mx-auto px-4 mb-16">
            <h2 className="text-2xl font-semibold text-center mb-8">Popular Sports</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sports.map((sport) => (
                <Card key={sport.name} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                      {sport.icon}
                    </div>
                    <h3 className="font-semibold mb-1">{sport.name}</h3>
                    <p className="text-sm text-muted-foreground">{sport.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Beautiful Courts Carousel */}
          <CourtsCarousel />

          {/* Features Section */}
          <section className="container mx-auto px-4 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose QuickCourt?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We make it easy to find, book, and play at the best sports venues in your city
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 bg-muted/30">
                  <CardContent className="p-6">
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section className="bg-muted/30 py-16 mb-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-muted-foreground">Book your perfect court in three simple steps</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">1. Search</h3>
                  <p className="text-muted-foreground">Find courts near you by location, sport, or venue name</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">2. Book</h3>
                  <p className="text-muted-foreground">Choose your preferred time slot and complete secure payment</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">3. Play</h3>
                  <p className="text-muted-foreground">Show up and play! Your court is reserved and ready</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 mb-16">
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-12 text-center">
                <Zap className="h-16 w-16 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
                <p className="text-xl mb-8 opacity-90">
                  Join thousands of players and start booking your favorite courts today
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" onClick={() => navigate('/venues')}>
                    <Target className="h-5 w-5 mr-2" />
                    Find Courts Near Me
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 hover:bg-primary-foreground/10">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </BackgroundGlow>
    </div>
  );
};

export default Index;
