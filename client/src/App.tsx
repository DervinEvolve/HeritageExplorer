import { Switch, Route, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Search, BookOpen, User } from "lucide-react";
import { Home } from "./pages/Home";
import { Research } from "./pages/Research";
import { Profile } from "./pages/Profile";

function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center space-x-6">
            <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <Search className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link href="/research" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <BookOpen className="h-4 w-4" />
              <span>Research</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900">Heritage.AI</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/research" component={Research} />
          <Route path="/profile" component={Profile} />
          <Route>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900">404 - Page Not Found</h2>
              <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
            </Card>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default App;