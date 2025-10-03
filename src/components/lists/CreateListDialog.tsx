import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserList } from '@/lib/listStorage';

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateList: (listData: Omit<UserList, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const COLORS = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' }
];

export function CreateListDialog({ open, onOpenChange, onCreateList }: CreateListDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onCreateList({
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      itemIds: []
    });

    setFormData({ name: '', description: '', color: 'blue' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Organize legislation into a custom collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="list-name">List Name</Label>
            <Input
              id="list-name"
              placeholder="Bay Area Housing Policy"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="list-description">Description (Optional)</Label>
            <Textarea
              id="list-description"
              placeholder="Housing legislation in the SF Bay Area"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full ${color.class} border-2 transition-all ${
                    formData.color === color.value ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create List</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
