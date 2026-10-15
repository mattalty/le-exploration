import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./styles.css";
import { Gallery } from "./app/Gallery";
import { Viewer } from "./app/Viewer";
import { Unlock } from "./app/Unlock";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/p/:slug" element={<Viewer />} />
        <Route path="/embed/:slug" element={<Viewer embed />} />
        <Route path="/unlock/:slug" element={<Unlock />} />
        <Route path="*" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
