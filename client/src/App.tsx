import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Navigator = lazy(() => import("./pages/Navigator"));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/navigator" component={Navigator} />
        <Route>
          <div className="p-10 text-center font-sans">
            <h2>Page not found</h2>
            <a href="/">← Go home</a>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}
