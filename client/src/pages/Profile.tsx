import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Profile() {
  // Mockup user data for prototype
  const mockUser = {
    name: "Demo User",
    email: "demo@example.com",
    interests: ["Ancient Civilizations", "Cultural Traditions", "Historical Artifacts"],
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback>{mockUser.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{mockUser.name}</h3>
              <p className="text-muted-foreground">{mockUser.email}</p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium mb-2">Research Interests</h4>
            <div className="flex flex-wrap gap-2">
              {mockUser.interests.map((interest, index) => (
                <div key={index} className="bg-secondary px-3 py-1 rounded-full text-sm">
                  {interest}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}