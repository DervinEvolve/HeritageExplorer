import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { askPerplexity } from "@/lib/perplexity";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentGallery } from "./DocumentGallery";

interface SearchResult {
  content: string;
  citations?: string[];
  documents?: Array<{
    id: string;
    title: string;
    imageUrl: string;
    description: string;
    type: "manuscript" | "letter" | "artifact" | "record";
  }>;
}

export function SearchInterface() {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeperiod, setTimeperiod] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedAuthenticity, setSelectedAuthenticity] = useState<string>("");

  const handleSearch = async () => {
    if (!searchTerm.trim() || loading) return;

    setLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      // Combine active filters
      const filters = [
        selectedSource && `from ${selectedSource}`,
        selectedDocType && `focusing on ${selectedDocType}`,
        selectedRegion && `from ${selectedRegion}`,
        selectedAuthenticity && `with ${selectedAuthenticity} sources`
      ].filter(Boolean);

      const filterContext = filters.length > 0 
        ? `. Context: ${filters.join(", ")}`
        : '';

      const query = `Research query: ${searchTerm}${
        timeperiod ? ` during the ${timeperiod} period` : ''
      }${filterContext}. Please provide detailed information about this topic, including relevant historical documents, manuscripts, letters, or artifacts.`;

      const result = await askPerplexity(query);
      setSearchResult(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (content: string) => {
    // Split by sections marked with ###
    return content.split('###').map((section, index) => {
      if (index === 0) {
        // Main content
        const paragraphs = section.trim().split('\n').filter(p => p.trim());
        return (
          <div key={index} className="prose prose-sm max-w-none">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-muted-foreground mb-4">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        );
      }

      // Section content
      const [title, ...contentParts] = section.split('\n');
      return (
        <div key={index} className="mt-6">
          <h3 className="text-lg font-semibold mb-3">{title.trim()}</h3>
          <div className="space-y-2">
            {contentParts
              .filter(part => part.trim())
              .map((part, idx) => (
                <p key={idx} className="text-muted-foreground">
                  {part.trim()}
                </p>
              ))}
          </div>
        </div>
      );
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search historical documents, artifacts, cultural practices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={timeperiod} onValueChange={setTimeperiod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prehistoric">Prehistoric (before 3000 BCE)</SelectItem>
                <SelectItem value="ancient">Ancient (3000 BCE - 500 CE)</SelectItem>
                <SelectItem value="medieval">Medieval (500 - 1500 CE)</SelectItem>
                <SelectItem value="early-modern">Early Modern (1500 - 1800 CE)</SelectItem>
                <SelectItem value="modern">Modern (1800 - 1945)</SelectItem>
                <SelectItem value="contemporary">Contemporary (1945 - Present)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger>
                <SelectValue placeholder="Official Records" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manuscripts">Manuscripts</SelectItem>
                <SelectItem value="letters">Letters & Diaries</SelectItem>
                <SelectItem value="official-records">Official Records</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDocType} onValueChange={setSelectedDocType}>
              <SelectTrigger>
                <SelectValue placeholder="Academic Papers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eyewitness-accounts">Eyewitness Accounts</SelectItem>
                <SelectItem value="academic-papers">Academic Papers</SelectItem>
                <SelectItem value="news-articles">News Articles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Geographic Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="african">Africa</SelectItem>
                <SelectItem value="european">Europe</SelectItem>
                <SelectItem value="asian">Asia</SelectItem>
                <SelectItem value="north-american">North America</SelectItem>
                <SelectItem value="south-american">South America</SelectItem>
                <SelectItem value="middle-eastern">Middle East</SelectItem>
                <SelectItem value="oceanian">Oceania</SelectItem>
                <SelectItem value="caribbean">Caribbean</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedAuthenticity} onValueChange={setSelectedAuthenticity}>
              <SelectTrigger>
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified-primary">Verified Primary</SelectItem>
                <SelectItem value="peer-reviewed">Peer Reviewed</SelectItem>
                <SelectItem value="contemporary">Contemporary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchResult && (
            <div className="space-y-8">
              {searchResult.documents && searchResult.documents.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Relevant Historical Documents</h2>
                  <DocumentGallery documents={searchResult.documents} />
                </div>
              )}

              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-6 space-y-6">
                  {formatContent(searchResult.content)}
                  {searchResult.citations && searchResult.citations.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Sources:</h4>
                      <div className="space-y-1">
                        {searchResult.citations.map((citation, idx) => (
                          <a
                            key={idx}
                            href={citation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-600 hover:underline"
                          >
                            {new URL(citation).hostname}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}