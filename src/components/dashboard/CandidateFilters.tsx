import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CandidateFiltersProps {
  roles: string[];
  onApplyFilters: (role: string, minScore: number) => void;
}

export function CandidateFilters({ roles, onApplyFilters }: CandidateFiltersProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(70);

  const handleApply = () => {
    onApplyFilters(selectedRole, minScore);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Filter Candidates</h2>
      
      <div className="flex flex-col sm:flex-row gap-6 items-end">
        {/* Role Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="role-filter" className="text-sm font-medium text-foreground mb-2 block">
            Role
          </Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-filter" className="w-full">
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Score Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Minimum Score: {minScore}
          </Label>
          <Slider
            value={[minScore]}
            onValueChange={(value) => setMinScore(value[0])}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        {/* Apply Button */}
        <Button onClick={handleApply} className="shrink-0">
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
