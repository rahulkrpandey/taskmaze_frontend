import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Project from "./pages/Project";
import Authentication from "./pages/Authentication";
import Kanban from "./pages/Kanban";
import ProtectedRoot from "./pages/ProtectedRoot";
import { AuthContextProvider } from "./context/AuthContext";
import ErrorBoundry from "./components/ErrorBoundry";
import { SocketContextProvider } from "./context/SocketContext";

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorBoundry />,
    element: <AuthContextProvider />,
    children: [
      {
        path: "",
        errorElement: <ErrorBoundry />,
        element: (
          <SocketContextProvider>
            <ProtectedRoot />
          </SocketContextProvider>
        ),
        children: [
          {
            path: "",
            errorElement: <ErrorBoundry />,
            element: <Project />,
          },
          {
            path: ":pid",
            errorElement: <ErrorBoundry />,
            element: <Kanban />,
          },
        ],
      },
      {
        path: "auth",
        errorElement: <ErrorBoundry />,
        element: <Authentication />,
      },
      {
        path: "test",
        errorElement: <ErrorBoundry />,
        element: <App />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    {/* <App /> */}
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
