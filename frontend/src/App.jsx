import React, { useCallback, useState, useEffect, useRef } from "react";
import CustomNode from "./pages/user/workflow/CustomNode.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WorkFlow from "./pages/user/workflow/WorkFlow.jsx";
import "./App.css";
import "./index.css";

export default function App() {
  return(
    <Router>
      <Routes>
        <Route path="/" element={<WorkFlow />}/>
      </Routes>
    </Router>
  )
}
