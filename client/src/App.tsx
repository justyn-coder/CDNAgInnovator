import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import Navigator from "./pages/Navigator";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/navigator" component={Navigator} />
      <Route>
        <div style={{ padding: 40, textAlign: "center", fontFamily: "DM Sans, sans-serif" }}>
          <h2>Page not found</h2>
          <a href="/">← Go home</a>
        </div>
      </Route>
    </Switch>
  );
}
