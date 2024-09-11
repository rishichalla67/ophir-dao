import {
  BrowserRouter as Router,
  Routes, // <-- Use Routes instead of Switch
  Route,
  Link,
} from "react-router-dom";
import LandingPage from "./components/landingPage";
import "./App.css";
import Nav from "./components/nav";
import AnalyticsDashboard from "./components/analyticsDashboard";
import Redeem from "./components/redeem";
import SeekerRound from "./components/seekerRound";
import WasmDev from "./components/wasmdev";
import RestakeDashboard from "./components/restakeDashboard";
import Swap from "./components/swap";
import Govern from "./components/govern";
import RedemptionAnalyticsDashboard from "./components/redeemAnalytics";

function App() {
  return (
    <Router>
      {/* Replace <Switch> with <Routes> */}
      <Nav />
      <Routes>
        {/* <Route path="/about" element={<About />} /> Update Route with element prop */}
        {/* <Route path="/users" element={<Users />} /> Update Route with element prop */}
        {/* <Route path="/" element={<Home />} /> Update Route with element prop */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="redeem" element={<Redeem />} />
        <Route path="seekers" element={<SeekerRound />} />
        <Route path="wasmdev" element={<WasmDev />} />
        <Route path="restake" element={<RestakeDashboard />} />
        <Route path="swap" element={<Swap />} />
        <Route path="govern" element={<Govern />} />
        <Route
          path="redeem-analytics"
          element={<RedemptionAnalyticsDashboard />}
        />
      </Routes>
    </Router>
  );
}

export default App;
