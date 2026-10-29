import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/index";
import { AuthProvider } from "./context/AuthContext";
import "@fontsource/afacad/400.css";
import "@fontsource/afacad/400-italic.css";
import "@fontsource/afacad/500.css";
import "@fontsource/afacad/600.css";
import "@fontsource/afacad/700.css";
import "@fontsource/afacad/700-italic.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* On place le AuthProvider tout en haut */}
    <AuthProvider>
      {/* Le RouterProvider doit être à l'intérieur du AuthProvider pour que les pages puissent accéder au contexte d'authentification */}
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
