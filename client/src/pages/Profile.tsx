import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X, Plus, Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Type for our user profile
interface UserProfile {
  id: number;
  name: string;
  email: string;
  interests: string[];
  avatarUrl?: string;
  firebaseId: string;
}

export function Profile() {
  // For now, use a userId of 1 for demonstration
  // In a real app, this would come from authentication
  const userId = 1;
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [formState, setFormState] = useState<Partial<UserProfile>>({
    name: "",
    email: "",
    interests: []
  });
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch user profile
  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/${userId}`);
      if (!response.ok) {
        // If user doesn't exist in our DB yet, we'll return a default
        if (response.status === 404) {
          return {
            id: userId,
            name: "Demo User",
            email: "demo@example.com",
            interests: ["Ancient Civilizations", "Cultural Traditions", "Historical Artifacts"],
            firebaseId: "demo-user-id",
            avatarUrl: undefined
          };
        }
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: Partial<UserProfile>) => {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProfile)
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  // Update form state when user data changes
  useEffect(() => {
    if (user) {
      setFormState({
        name: user.name,
        email: user.email,
        interests: user.interests || [],
      });
    }
  }, [user]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formState);
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // File size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`/api/user/${userId}/avatar`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const result = await response.json();
      
      // Update cache with new avatar URL
      queryClient.setQueryData(["user", userId], (oldData: any) => ({
        ...oldData,
        avatarUrl: result.avatarUrl
      }));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Add interest
  const addInterest = () => {
    if (!newInterest.trim()) return;
    
    // Don't add duplicates
    if (formState.interests?.includes(newInterest.trim())) {
      toast({
        title: "Interest already exists",
        description: "This interest is already in your list.",
        variant: "destructive",
      });
      return;
    }
    
    setFormState({
      ...formState,
      interests: [...(formState.interests || []), newInterest.trim()]
    });
    setNewInterest("");
  };

  // Remove interest
  const removeInterest = (interest: string) => {
    setFormState({
      ...formState,
      interests: formState.interests?.filter(i => i !== interest)
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    if (user) {
      setFormState({
        name: user.name,
        email: user.email,
        interests: user.interests || [],
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive">Failed to load profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 md:px-0">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your personal information and research interests</CardDescription>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={cancelEditing}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Section */}
          <div className={`flex ${isMobile ? 'flex-col' : 'items-center space-x-6'} ${isMobile ? 'space-y-4' : ''}`}>
            <div className="relative">
              <Avatar className={`${isMobile ? 'h-24 w-24 mx-auto' : 'h-32 w-32'} border-2 border-border`}>
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="absolute -bottom-2 -right-2">
                  <Button 
                    size="sm" 
                    className="rounded-full h-8 w-8 p-0" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="Your email"
                    />
                  </div>
                </div>
              ) : (
                <div className={`${isMobile ? 'text-center' : ''}`}>
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <p className="text-muted-foreground mt-1">{user.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Research Interests Section */}
          <div className="mt-8">
            <h4 className="text-lg font-medium mb-3">Research Interests</h4>
            
            {isEditing && (
              <div className="flex items-center space-x-2 mb-4">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add a new research interest"
                  onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button onClick={addInterest} type="button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {(isEditing ? formState.interests : user.interests)?.map((interest, index) => (
                <Badge 
                  key={index} 
                  variant={isEditing ? "outline" : "secondary"}
                  className="py-1.5"
                >
                  {interest}
                  {isEditing && (
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removeInterest(interest)}
                    />
                  )}
                </Badge>
              ))}
              
              {(isEditing ? formState.interests : user.interests)?.length === 0 && (
                <p className="text-muted-foreground text-sm">No research interests added yet.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}