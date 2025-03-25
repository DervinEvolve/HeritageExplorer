import { Timeline } from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";

export function ResearchTimeline() {
  const timelineData = [
    {
      date: "3000 BCE",
      title: "Early Bronze Age",
      image: "https://images.unsplash.com/photo-1560698421-8b6a7d0d89dc",
      description: "Development of bronze metallurgy and early urban civilizations"
    },
    {
      date: "500 CE",
      title: "Medieval Period",
      image: "https://images.unsplash.com/photo-1633871677534-ae14eb2d4ff0",
      description: "Rise of manuscript culture and religious institutions"
    },
    {
      date: "1500 CE",
      title: "Renaissance",
      image: "https://images.unsplash.com/photo-1663681240426-9d8a04037005",
      description: "Cultural revival and artistic innovation"
    }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-8">
          {timelineData.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-32 flex-shrink-0 text-sm font-medium">
                {item.date}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-primary" />
                  <div className="pl-6 pb-8">
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
