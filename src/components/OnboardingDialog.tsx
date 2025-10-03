import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Target, Bell } from 'lucide-react';
import { setGuestScope, setGuestTopics } from '@/lib/guestSessionStorage';
import { createTrackedTerm } from '@/lib/trackedTermStorage';

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const CATEGORIES = [
  { slug: 'housing', label: 'Housing' },
  { slug: 'transportation', label: 'Transportation' },
  { slug: 'education', label: 'Education' },
  { slug: 'health', label: 'Health' },
  { slug: 'environment', label: 'Environment' },
  { slug: 'public-safety', label: 'Public Safety' },
  { slug: 'budget', label: 'Budget' },
  { slug: 'economic-dev', label: 'Economic Development' },
];

export function OnboardingDialog({ open, onComplete, onSkip }: OnboardingDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [termName, setTermName] = useState('');

  const toggleCategory = (slug: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, slug]);
    } else {
      setSelectedCategories(prev => prev.filter(s => s !== slug));
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedLocation) return;
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Save location
    if (selectedLocation) {
      sessionStorage.setItem('userLocation', selectedLocation);
      setGuestScope([selectedLocation]);
    }

    // Save categories
    if (selectedCategories.length > 0) {
      sessionStorage.setItem('userCategories', JSON.stringify(selectedCategories));
      setGuestTopics(selectedCategories);
    }

    // Create tracked term if provided
    if (keywordInput.trim() && termName.trim()) {
      const keywords = keywordInput.split(',').map(k => k.trim()).filter(Boolean);
      createTrackedTerm({
        name: termName,
        keywords,
        jurisdictions: [selectedLocation],
        active: true,
        alertEnabled: true,
      });
    }

    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Welcome to Local Gov Watch</DialogTitle>
          <DialogDescription className="text-center">
            Quick setup to personalize your experience (30 seconds)
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold">Where are you located?</h3>
              <p className="text-sm text-muted-foreground">
                We'll show you relevant legislation and meetings
              </p>
            </div>

            <div className="space-y-2">
              <Label>Select your area</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a location..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="austin-tx">Austin, TX</SelectItem>
                  <SelectItem value="travis-county-tx">Travis County, TX</SelectItem>
                  <SelectItem value="texas">Texas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold">What interests you?</h3>
              <p className="text-sm text-muted-foreground">
                Select topics you'd like to follow (optional)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(category => (
                <label
                  key={category.slug}
                  className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={(checked) => toggleCategory(category.slug, checked as boolean)}
                  />
                  <span className="text-sm">{category.label}</span>
                </label>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              You can change these anytime in settings
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="text-lg font-semibold">Get instant alerts</h3>
              <p className="text-sm text-muted-foreground">
                Monitor specific keywords for immediate notifications (optional)
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Track keywords like:</Label>
                <Input
                  placeholder="housing, biomedical, transportation"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate keywords with commas
                </p>
              </div>

              <div>
                <Label>Name this alert:</Label>
                <Input
                  placeholder="My Policy Interests"
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Skip this step and add keywords later in Alerts
            </p>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={step === 1 && !selectedLocation}>
              {step === 3 ? 'Get Started' : 'Continue'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
