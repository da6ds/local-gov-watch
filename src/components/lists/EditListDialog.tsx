import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserList } from '@/lib/listStorage';

interface EditListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: UserList | null;
  onUpdateList: (id: string, updates: Partial<UserList>) => void;
}

const COLORS = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' }
];

export function EditListDialog({ open, onOpenChange, list, onUpdateList }: EditListDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name,
        description: list.description || '',
        color: list.color || 'blue'
      });
    }
  }, [list]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !list) return;

    onUpdateList(list.id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>
            Update your list details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-list-name">List Name</Label>
            <Input
              id="edit-list-name"
              placeholder="Bay Area Housing Policy"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-list-description">Description (Optional)</Label>
            <Textarea
              id="edit-list-description"
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
