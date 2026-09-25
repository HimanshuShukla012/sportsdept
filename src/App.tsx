import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PCIGISDashboard from "./PCIGISDashboard";
import SwachhBharatVideoHub from "./videoscreen"

function App() {
  return (
    <BrowserRouter>
      {/* Optional simple nav — remove if you don't need it */}
      

      <Routes>
        <Route path="/" element={<PCIGISDashboard />} />
        <Route path="/media-gallery" element={<SwachhBharatVideoHub />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;