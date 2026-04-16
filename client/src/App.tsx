import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Navigator = lazy(() => import("./pages/Navigator"));
const Demo = lazy(() => import("./pages/Demo"));
const ForBioEnterprise = lazy(() => import("./pages/ForBioEnterprise"));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/navigator" component={Navigator} />
        <Route path="/demo" component={Demo} />
        <Route path="/for/bioenterprise" component={ForBioEnterprise} />
        <Route>
          <div className="p-10 text-center font-sans">
            <div className="text-4xl mb-4">🚜</div>
            <h2 className="text-xl font-bold mb-2">Wrong field!</h2>
            <p className="text-gray-500 mb-4">This page doesn't exist — let's get you back on track.</p>
            <a href="/" className="text-[#1B4332] font-medium hover:underline">← Back to Trellis</a>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}
