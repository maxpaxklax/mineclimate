import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface LocationPermissionProps {
  error: string;
  onSearch: (city: string) => void;
  isLoading: boolean;
}

export function LocationPermission({ error, onSearch, isLoading }: LocationPermissionProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Weather City
        </h1>
        
        <p className="mb-6 text-muted-foreground">
          {error === 'Location permission denied' 
            ? 'Enable location access to see your local weather, or search for a city below.'
            : error || 'Search for a city to see its weather visualization.'}
        </p>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter city name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>
      </div>
    </div>
  );
}
