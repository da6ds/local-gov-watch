import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  UserList,
  getAllLists,
  createList as createListStorage,
  updateList as updateListStorage,
  deleteList as deleteListStorage,
  addItemToList as addItemToListStorage,
  removeItemFromList as removeItemFromListStorage
} from '@/lib/listStorage';

export function useListManagement() {
  const [lists, setLists] = useState<Record<string, UserList>>({});

  // Load lists from storage
  useEffect(() => {
    setLists(getAllLists());
  }, []);

  const refreshLists = () => {
    setLists(getAllLists());
  };

  const createList = (listData: Omit<UserList, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newList = createListStorage(listData);
    refreshLists();
    toast.success('List created successfully');
    return newList;
  };

  const updateList = (id: string, updates: Partial<UserList>) => {
    updateListStorage(id, updates);
    refreshLists();
    toast.success('List updated successfully');
  };

  const deleteList = (id: string) => {
    deleteListStorage(id);
    refreshLists();
    toast.success('List deleted successfully');
  };

  const addItemToList = (listId: string, itemId: string) => {
    addItemToListStorage(listId, itemId);
    refreshLists();
    toast.success('Item added to list');
  };

  const removeItemFromList = (listId: string, itemId: string) => {
    removeItemFromListStorage(listId, itemId);
    refreshLists();
    toast.success('Item removed from list');
  };

  return {
    lists,
    createList,
    updateList,
    deleteList,
    addItemToList,
    removeItemFromList,
    refreshLists
  };
}
