// SessionStorage utilities for user lists (demo mode)

export interface UserList {
  id: string;
  name: string;
  description?: string;
  color?: string;
  itemIds: string[];
  createdAt: string;
  updatedAt: string;
}

const USER_LISTS_KEY = 'userLists';

export function getAllLists(): Record<string, UserList> {
  if (typeof window === 'undefined') return {};
  
  const stored = sessionStorage.getItem(USER_LISTS_KEY);
  if (!stored) return {};
  
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function getList(id: string): UserList | null {
  const lists = getAllLists();
  return lists[id] || null;
}

export function createList(listData: Omit<UserList, 'id' | 'createdAt' | 'updatedAt'>): UserList {
  if (typeof window === 'undefined') throw new Error('Window not available');
  
  const newList: UserList = {
    id: crypto.randomUUID(),
    ...listData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const existing = getAllLists();
  existing[newList.id] = newList;
  sessionStorage.setItem(USER_LISTS_KEY, JSON.stringify(existing));
  
  return newList;
}

export function updateList(id: string, updates: Partial<UserList>): void {
  if (typeof window === 'undefined') return;
  
  const lists = getAllLists();
  if (lists[id]) {
    lists[id] = { 
      ...lists[id], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    sessionStorage.setItem(USER_LISTS_KEY, JSON.stringify(lists));
  }
}

export function deleteList(id: string): void {
  if (typeof window === 'undefined') return;
  
  const lists = getAllLists();
  delete lists[id];
  sessionStorage.setItem(USER_LISTS_KEY, JSON.stringify(lists));
}

export function addItemToList(listId: string, itemId: string): void {
  const list = getList(listId);
  if (!list || list.itemIds.includes(itemId)) return;
  
  updateList(listId, {
    itemIds: [...list.itemIds, itemId]
  });
}

export function removeItemFromList(listId: string, itemId: string): void {
  const list = getList(listId);
  if (!list) return;
  
  updateList(listId, {
    itemIds: list.itemIds.filter(id => id !== itemId)
  });
}
