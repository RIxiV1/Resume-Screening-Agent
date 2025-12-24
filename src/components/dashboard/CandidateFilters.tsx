import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Filter } from 'lucide-react';
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
  const [minScore, setMinScore] = useState<number>(0);

  const handleApply = () => {
    onApplyFilters(selectedRole, minScore);
  };

  const handleReset = () => {
    setSelectedRole('');
    setMinScore(0);
    onApplyFilters('', 0);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-6 shadow-soft-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">Filters</h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-5 items-end">
        {/* Role Filter */}
        <div className="flex-1 min-w-[180px] w-full sm:w-auto">
          <Label htmlFor="role-filter" className="text-sm font-medium text-foreground mb-2 block">
            Role
          </Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-filter" className="w-full">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.length > 40 ? role.substring(0, 40) + '...' : role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum Score Filter */}
        <div className="flex-1 min-w-[200px] w-full sm:w-auto">
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Min Score: <span className="text-primary font-semibold">{minScore}%</span>
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

        {/* Buttons */}
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
