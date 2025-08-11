import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

export type Venue = {
  id: string;
  name: string;
  sport: string;
  pricePerHour: number;
  rating: number;
  location: string;
};

const VenueCard = ({ venue }: { venue: Venue }) => {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Card className="overflow-hidden border border-border/60">
        <div className="h-40 bg-gradient-primary" aria-label={`${venue.sport} venue preview`} />
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{venue.name}</h3>
            <div className="flex items-center gap-1 text-sm"><Star className="text-brand" /> {venue.rating.toFixed(1)}</div>
          </div>
          <p className="text-sm text-muted-foreground capitalize">{venue.sport}</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin /> {venue.location}</div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm">${venue.pricePerHour}/hr</div>
            <Button asChild variant="pill"><Link to={`/venue/${venue.id}`}>View slots</Link></Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default VenueCard;
