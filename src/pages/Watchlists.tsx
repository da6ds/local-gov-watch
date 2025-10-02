import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { ListCard } from "@/components/lists/ListCard";
import { ListDetailView } from "@/components/lists/ListDetailView";
import { EmptyListState } from "@/components/lists/EmptyListState";

// Mock data for V2 preview
const mockLists = [
  {
    id: "1",
    name: "My Priorities",
    description: "Key legislation and meetings I'm tracking closely",
    itemCount: 8,
    billsCount: 5,
    meetingsCount: 2,
    electionsCount: 1,
    isDefault: false,
  },
  {
    id: "2",
    name: "Housing Issues",
    description: "All items related to housing policy and development",
    itemCount: 5,
    billsCount: 4,
    meetingsCount: 1,
    electionsCount: 0,
    isDefault: false,
  },
  {
    id: "3",
    name: "Transportation",
    description: "Transit, roads, and mobility initiatives",
    itemCount: 3,
    billsCount: 2,
    meetingsCount: 1,
    electionsCount: 0,
    isDefault: false,
  },
];

const mockListItems = {
  "1": [
    {
      id: "item-1",
      entityType: "legislation" as const,
      entityId: "123",
      title: "HB 2024 - Affordable Housing Development",
      subtitle: "Austin City Council",
      date: "Introduced March 15, 2024",
    },
    {
      id: "item-2",
      entityType: "meeting" as const,
      entityId: "456",
      title: "Planning Commission Meeting",
      subtitle: "City Planning Department",
      date: "April 2, 2024",
    },
  ],
  "2": [
    {
      id: "item-3",
      entityType: "legislation" as const,
      entityId: "789",
      title: "Zoning Reform Bill",
      subtitle: "Austin City Council",
      date: "Introduced February 10, 2024",
    },
  ],
  "3": [
    {
      id: "item-4",
      entityType: "legislation" as const,
      entityId: "101",
      title: "Transit Expansion Act",
      subtitle: "Travis County",
      date: "Introduced March 1, 2024",
    },
  ],
};

export default function Watchlists() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showMockData] = useState(true); // V2 Preview mode

  const selectedList = mockLists.find((list) => list.id === selectedListId);
  const selectedListItems = selectedListId ? mockListItems[selectedListId as keyof typeof mockListItems] || [] : [];

  if (selectedList) {
    return (
      <Layout>
        <ListDetailView
          name={selectedList.name}
          description={selectedList.description}
          items={selectedListItems}
          onBack={() => setSelectedListId(null)}
          isPreview={true}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Lock Banner */}
        <Alert className="border-muted">
          <Lock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Lists require an account. Sign in to create and manage your lists.</span>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Lists</h1>
            <p className="text-muted-foreground">
              Organize legislation, meetings, and elections into custom collections
            </p>
          </div>
          <Button disabled={true} className="opacity-50">
            <Plus className="h-4 w-4 mr-2" />
            Create List
          </Button>
        </div>

        {/* Lists Grid */}
        {showMockData && mockLists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockLists.map((list) => (
              <ListCard
                key={list.id}
                name={list.name}
                description={list.description}
                itemCount={list.itemCount}
                billsCount={list.billsCount}
                meetingsCount={list.meetingsCount}
                electionsCount={list.electionsCount}
                isDefault={list.isDefault}
                isPreview={true}
                onClick={() => setSelectedListId(list.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyListState isPreview={true} />
        )}
      </div>
    </Layout>
  );
}
