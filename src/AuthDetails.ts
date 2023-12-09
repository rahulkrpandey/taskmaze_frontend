interface AuthDetailsType {
  TOKEN: string;
  USERNAME: string;
  expiresIn: number;
}

export const AuthDetails: AuthDetailsType = {
  TOKEN: "",
  USERNAME: "",
  expiresIn: 0,
};
