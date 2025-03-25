import { SearchInterface } from "@/components/SearchInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Home() {
  const featuredArtifacts = [
    {
      title: "Ancient Pottery",
      image: "https://images.unsplash.com/photo-1560698421-8b6a7d0d89dc",
      description: "Traditional ceramic vessel from the Bronze Age"
    },
    {
      title: "Historical Manuscript",
      image: "https://images.unsplash.com/photo-1633871677534-ae14eb2d4ff0",
      description: "Medieval illuminated manuscript"
    },
    {
      title: "Cultural Ceremony",
      image: "https://images.unsplash.com/photo-1525496649711-a6c069fc6a1b",
      description: "Traditional celebration rituals"
    }
  ];

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Heritage.AI</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover and explore the rich tapestry of human cultural heritage through our advanced research platform.
        </p>
      </section>

      <SearchInterface />

      <section>
        <h2 className="text-2xl font-semibold mb-4">Featured Artifacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredArtifacts.map((artifact, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{artifact.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={artifact.image} 
                  alt={artifact.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <p className="text-sm text-muted-foreground">{artifact.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}