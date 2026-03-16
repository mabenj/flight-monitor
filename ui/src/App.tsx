import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import "./App.css";
import ActiveFlightsPage from "./components/ActiveFlightsPage.tsx";
import { Button } from "@/components/ui/button.tsx";
import { SquareStackIcon, Plane } from "lucide-react";
import BoundsPage from "./components/BoundsPage.tsx";
import logo from "./assets/logo.png";

function Navigation() {
  const location = useLocation();
  const isFlights = location.pathname === "/";
  const isBounds = location.pathname === "/bounds";

  return (
    <nav className="flex gap-2">
      <Link to="/" aria-current={isFlights ? "page" : undefined}>
        <Button variant={isFlights ? "default" : "ghost"} size="sm">
          <Plane className="size-4 mr-2" /> Active flights
        </Button>
      </Link>
      <Link to="/bounds" aria-current={isBounds ? "page" : undefined}>
        <Button variant={isBounds ? "default" : "ghost"} size="sm">
          <SquareStackIcon className="size-4 mr-2" /> Bounding boxes
        </Button>
      </Link>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-6 w-6" />
          <h1 className="text-lg font-semibold text-slate-900">
            Flight monitor
          </h1>
        </Link>
        <Navigation />
      </header>

      <Routes>
        <Route path="/" element={<ActiveFlightsPage />} />
        <Route path="/bounds" element={<BoundsPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
