import { useState, useEffect } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchCities, LocationData } from '@/lib/weather';
import { useDebounce } from '@/hooks/useDebounce';

interface LocationPermissionProps {
  error: string;
  onSelectLocation: (location: LocationData) => void;
  isLoading: boolean;
}

export function LocationPermission({ error, onSelectLocation, isLoading }: LocationPermissionProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    async function search() {
      if (debouncedQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await searchCities(debouncedQuery);
        setSearchResults(results);
      } catch (e) {
        console.error('Search failed:', e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
    
    search();
  }, [debouncedQuery]);

  const handleSelectResult = (location: LocationData) => {
    onSelectLocation(location);
    setQuery('');
    setSearchResults([]);
  };

  const formatLocationLabel = (location: LocationData) => {
    const parts = [location.city];
    if (location.admin1) parts.push(location.admin1);
    if (location.country) parts.push(location.country);
    return parts.join(', ');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 overflow-hidden">
          <img src="/pwa-192x192.png" alt="mineclimate" className="h-14 w-14 object-contain" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          mineclimate
        </h1>
        
        <p className="mb-6 text-muted-foreground">
          {error === 'Location permission denied' 
            ? 'Enable location access to see your local weather, or search for a city below.'
            : error || 'Search for a city to see its weather visualization.'}
        </p>
        
        <div className="relative">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter city name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pr-10"
              disabled={isLoading}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-48 overflow-y-auto rounded-xl border bg-background shadow-lg">
              {searchResults.map((location, index) => (
                <button
                  key={`${location.latitude}-${location.longitude}-${index}`}
                  type="button"
                  onClick={() => handleSelectResult(location)}
                  disabled={isLoading}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 first:rounded-t-xl last:rounded-b-xl disabled:opacity-50"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{formatLocationLabel(location)}</span>
                </button>
              ))}
            </div>
          )}
          
          {debouncedQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border bg-background px-4 py-3 text-center text-sm text-muted-foreground shadow-lg">
              No cities found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
