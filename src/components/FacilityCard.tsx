import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Users, CheckCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Facility } from "@/lib/api";

interface FacilityCardProps {
  venue: Facility;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
}

const FacilityCard = ({ venue, viewMode = 'grid', onClick }: FacilityCardProps) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/venues/${venue.id}`);
    }
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/booking?venueId=${venue.id}`);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getOperatingHours = () => {
    if (!venue.courts || venue.courts.length === 0) return 'Hours not available';
    
    const earliestOpen = Math.min(...venue.courts.map(c => c.openTime));
    const latestClose = Math.max(...venue.courts.map(c => c.closeTime));
    
    return `${formatTime(earliestOpen)} - ${formatTime(latestClose)}`;
  };

  const defaultImage = '/placeholder.svg';
  const venueImage = venue.images && venue.images.length > 0 ? venue.images[0] : defaultImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card 
        className={`cursor-pointer h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white ${
          viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
        }`}
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className={`relative overflow-hidden ${
          viewMode === 'list' ? 'w-64 flex-shrink-0' : 'aspect-[4/3]'
        }`}>
          <img
            src={venueImage}
            alt={venue.name}
            className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
              !isImageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
          
          {/* Loading placeholder */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-600 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Available
            </Badge>
          </div>

          {/* Court count badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-700">
              {venue.courts?.length || 0} courts
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className={`flex flex-col flex-1 ${viewMode === 'list' ? 'p-6' : ''}`}>
          <CardHeader className={viewMode === 'list' ? 'px-0 pb-4' : 'pb-3'}>
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1 hover:text-green-600 transition-colors">
                {venue.name}
              </h3>
              
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{venue.location}</span>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                {venue.description}
              </p>
            </div>
          </CardHeader>

          <CardContent className={`flex-1 flex flex-col justify-between ${viewMode === 'list' ? 'px-0' : ''}`}>
            {/* Sports Tags */}
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap gap-1.5">
                {venue.sports.slice(0, 3).map((sport, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    {sport}
                  </Badge>
                ))}
                {venue.sports.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{venue.sports.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Amenities */}
              {venue.amenities && venue.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {venue.amenities.slice(0, 2).map((amenity, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs bg-gray-100 text-gray-600"
                    >
                      {amenity}
                    </Badge>
                  ))}
                  {venue.amenities.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{venue.amenities.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{getOperatingHours()}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>by {venue.owner?.fullName || 'Owner'}</span>
                </div>
              </div>
              
              {venue.priceRange && (
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>
                    {venue.priceRange.min === venue.priceRange.max 
                      ? `$${venue.priceRange.min}/hour`
                      : `$${venue.priceRange.min} - $${venue.priceRange.max}/hour`
                    }
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className={`space-y-2 ${viewMode === 'list' ? 'flex-shrink-0' : ''}`}>
              <Button 
                onClick={handleBookNow}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Now
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleCardClick}
                className="w-full border-green-200 text-green-700 hover:bg-green-50"
                size="sm"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default FacilityCard;
