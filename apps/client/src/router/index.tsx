import { createBrowserRouter } from "react-router-dom";
import RegisterPage from "@/pages/Register/RegisterPage";
import LoginPage from "@/pages/Login/LoginPage";
import LandingPage from "@/pages/Landing/LandingPage";
import AccueilPage from "@/pages/Accueil/AccueilPage";
import ParametrePage from "@/pages/Parametre/ParametrePage";
import PrivateRoute from "./PrivateRoute";
import PrivateLayout from "@/components/layout/PrivateLayout";
import MentionsLegalesPage from "@/pages/MentionsLegales/MentionsLegalesPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import NotFoundPage from "@/pages/NotFound/NotFoundPage";
import VerifyEmailPage from "@/pages/VerifyEmail/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPassword/ResetPasswordPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
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
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <PrivateLayout />,
        children: [
          {
            path: "/accueil",
            element: <AccueilPage />,
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
