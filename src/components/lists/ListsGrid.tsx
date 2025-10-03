import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserList } from "@/lib/listStorage";
import { MoreHorizontal, Edit, Trash, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ListsGridProps {
  lists: Record<string, UserList>;
  onEditList: (id: string) => void;
  onDeleteList: (id: string) => void;
}

export function ListsGrid({ lists, onEditList, onDeleteList }: ListsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.values(lists).map(list => (
        <ListCard
          key={list.id}
          list={list}
          onEdit={() => onEditList(list.id)}
          onDelete={() => onDeleteList(list.id)}
        />
      ))}
    </div>
  );
}

interface ListCardProps {
  list: UserList;
  onEdit: () => void;
  onDelete: () => void;
}

function ListCard({ list, onEdit, onDelete }: ListCardProps) {
  const navigate = useNavigate();
  const itemCount = list.itemIds.length;

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500'
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <CardHeader className="p-0 mb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colorClasses[list.color || 'blue']}`} />
              {list.name}
            </CardTitle>
            {list.description && (
              <CardDescription className="text-sm mt-1">
                {list.description}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit List
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete List
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete List?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{list.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          <span>Updated {new Date(list.updatedAt).toLocaleDateString()}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/lists/${list.id}`)}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Items
        </Button>
      </CardContent>
    </Card>
  );
}
