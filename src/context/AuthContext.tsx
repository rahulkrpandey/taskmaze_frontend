import React from "react";
import { Outlet } from "react-router-dom";

interface AuthDetailsType {
  TOKEN: string;
  USERNAME: string;
  expiresIn: number;
}

export const AuthContext = React.createContext<
  | [AuthDetailsType, React.Dispatch<React.SetStateAction<AuthDetailsType>>]
  | undefined
>(undefined);

export const AuthContextProvider = () => {
  const context = React.useState<AuthDetailsType>({
    TOKEN: "",
    USERNAME: "",
    expiresIn: 0,
  });
  return (
    <AuthContext.Provider value={context}>
      <Outlet />
    </AuthContext.Provider>
  );
};
