import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useListManagement } from "@/hooks/useListManagement";
import { EmptyListsState } from "@/components/lists/EmptyListsState";
import { ListsGrid } from "@/components/lists/ListsGrid";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { EditListDialog } from "@/components/lists/EditListDialog";
import { getList } from "@/lib/listStorage";

export default function MyLists() {
  const { lists, createList, updateList, deleteList } = useListManagement();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);

  const handleEditList = (id: string) => {
    setEditingListId(id);
    setShowEditDialog(true);
  };

  const editingList = editingListId ? getList(editingListId) : null;

  return (
    <Layout>
      <div className="container py-3">
        {/* Demo mode indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <AlertCircle className="w-4 h-4" />
          Demo Mode - Lists saved for this session only
        </div>

        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">My Lists</h1>
            <p className="text-sm text-muted-foreground">
              Organize legislation into custom collections
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create List
          </Button>
        </div>

        {/* Lists grid or empty state */}
        {Object.keys(lists).length === 0 ? (
          <EmptyListsState onCreateList={() => setShowCreateDialog(true)} />
        ) : (
          <ListsGrid
            lists={lists}
            onEditList={handleEditList}
            onDeleteList={deleteList}
          />
        )}

        <CreateListDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateList={createList}
        />

        <EditListDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          list={editingList}
          onUpdateList={updateList}
        />
      </div>
    </Layout>
  );
}
