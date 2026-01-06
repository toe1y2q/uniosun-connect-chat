import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface GigFiltersProps {
  onFilterChange: (filters: GigFilters) => void;
  filters: GigFilters;
}

export interface GigFilters {
  search: string;
  category: string;
  location_type: string;
  payment_type: string;
  budget_min: string;
  budget_max: string;
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'micro-jobs', label: 'Micro Jobs' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'campus-hustles', label: 'Campus Hustles' },
  { value: 'internships', label: 'Internships' },
  { value: 'remote', label: 'Remote Work' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'events', label: 'Events' },
  { value: 'design', label: 'Design' },
  { value: 'writing', label: 'Writing' },
  { value: 'tech', label: 'Tech' },
];

const locationTypes = [
  { value: 'all', label: 'All Locations' },
  { value: 'remote', label: 'Remote' },
  { value: 'campus', label: 'Campus' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'nationwide', label: 'Nationwide' },
];

const paymentTypes = [
  { value: 'all', label: 'All Payment Types' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
];

const GigFilters = ({ onFilterChange, filters }: GigFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key: keyof GigFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      category: 'all',
      location_type: 'all',
      payment_type: 'all',
      budget_min: '',
      budget_max: '',
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.category !== 'all' || 
    filters.location_type !== 'all' ||
    filters.payment_type !== 'all' ||
    filters.budget_min ||
    filters.budget_max;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search gigs by title, skills, or keywords..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[150px]">
            <Select 
              value={filters.category} 
              onValueChange={(v) => handleChange('category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select 
              value={filters.location_type} 
              onValueChange={(v) => handleChange('location_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locationTypes.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={showAdvanced ? 'bg-primary/10' : ''}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Payment Type
              </Label>
              <Select 
                value={filters.payment_type} 
                onValueChange={(v) => handleChange('payment_type', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Min Budget (₦)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={filters.budget_min}
                onChange={(e) => handleChange('budget_min', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Max Budget (₦)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={filters.budget_max}
                onChange={(e) => handleChange('budget_max', e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GigFilters;
