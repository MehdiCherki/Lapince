import { createBrowserRouter } from "react-router-dom";
import RegisterPage from "../pages/auth/RegisterPage";
import LoginPage from "../pages/auth/Login/loginPage";
import LandingPage from "../pages/landingPage/landingPage";
import TransactionPage from "../pages/Transaction/TransactionPage";
import ParametrePage from "../pages/Parametre/ParametrePage";
import PrivateRoute from "../components/PrivateRoute";
import PrivateLayout from "../components/Layout/PrivateLayout";
import MentionsLegalesPage from "../pages/MentionsLegales/MentionsLegalesPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import NotFoundPage from "../pages/NotFound/NotFoundPage";

export const router = createBrowserRouter([
  // --- ROUTES PUBLIQUES ---
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/mentions-legales",
    element: <MentionsLegalesPage />,
  },

  {
    path: "*",
    element: <NotFoundPage />,
  },

  // --- ROUTES PRIVÉES ---
  {
    element: <PrivateRoute />, // vérifie l'auth
    children: [
      {
        element: <PrivateLayout />, // ajoute le bouton logout sur toutes les pages enfants
        children: [
          {
            path: "/accueil",
            element: <TransactionPage />,
            // C'est la page d'accueil après login.
          },
          {
            path: "/parametres",
            element: <ParametrePage />,
          },
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
]);
