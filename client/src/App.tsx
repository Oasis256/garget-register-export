import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import RegisterAsset from "./pages/RegisterAsset";
import AssetDetail from "./pages/AssetDetail";
import Verify from "./pages/Verify";
import StolenReport from "./pages/StolenReport";
import Transfers from "./pages/Transfers";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import LawEnforcement from "./pages/LawEnforcement";
import AdminPanel from "./pages/AdminPanel";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/assets" component={Assets} />
      <Route path="/assets/register" component={RegisterAsset} />
      <Route path="/assets/:id" component={AssetDetail} />
      <Route path="/verify" component={Verify} />
      <Route path="/verify/:qrId" component={Verify} />
      <Route path="/stolen" component={StolenReport} />
      <Route path="/transfers" component={Transfers} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/law-enforcement" component={LawEnforcement} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
