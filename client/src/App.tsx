import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import PortalFeedbackFloater from "./components/PortalFeedbackFloater";

const Home = lazy(() => import("./pages/Home"));
const Navigator = lazy(() => import("./pages/Navigator"));
const Demo = lazy(() => import("./pages/Demo"));
const ForBioEnterprise = lazy(() => import("./pages/ForBioEnterprise"));
const PartnerPortal = lazy(() => import("./pages/PartnerPortal"));
const PartnersAdmin = lazy(() => import("./pages/PartnersAdmin"));

function MaybeFloater() {
  const [location] = useLocation();
  // Don't show the floater on the portal itself (feedback lives there natively)
  // or on admin pages.
  if (location.startsWith("/for/") && location.split("/").length >= 4) return null;
  if (location.startsWith("/admin/")) return null;
  return <PortalFeedbackFloater />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/navigator" component={Navigator} />
        <Route path="/demo" component={Demo} />
        <Route path="/for/bioenterprise" component={ForBioEnterprise} />
        <Route path="/for/:org/:person" component={PartnerPortal} />
        <Route path="/admin/partners" component={PartnersAdmin} />
        <Route path="/admin/partners/:org" component={PartnersAdmin} />
        <Route>
          <div className="p-10 text-center font-sans">
            <div className="text-4xl mb-4">🚜</div>
            <h2 className="text-xl font-bold mb-2">Wrong field!</h2>
            <p className="text-gray-500 mb-4">This page doesn't exist — let's get you back on track.</p>
            <a href="/" className="text-[#1B4332] font-medium hover:underline">← Back to Trellis</a>
          </div>
        </Route>
      </Switch>
      <MaybeFloater />
    </Suspense>
  );
}
