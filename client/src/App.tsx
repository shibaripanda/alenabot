import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StartPage } from "./pages/startPage/StartPage";
import { DashboardPage } from "./pages/dashboardPage/DashboardPage";

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<StartPage/>} />
            <Route path="/dashboard" element={<DashboardPage/>} />
          </Routes>
        </BrowserRouter>
    </MantineProvider>
  );
}
