import React, { useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Toaster from "../components/Toast";

interface DetailType {
  username: string;
  password: string;
}

interface ToastInfoType {
  title: string;
  description: string;
  type: "success" | "error";
}

const Authentication = () => {
  const [details, setDetails] = React.useState<DetailType>({
    username: "",
    password: "",
  });

  const navigate = useNavigate();

  const context = React.useContext(AuthContext);

  const [toastOpen, setToastOpen] = React.useState<boolean>(false);
  const [toastInfo, setToastInfo] = React.useState<ToastInfoType>({
    title: "",
    description: "",
    type: "error",
  });

  // if (!context) {
  //   return <div>Context not available</div>;
  // }

  // const [AuthDetails, setAuthDetails] = context;

  const users: DetailType[] = [
    { username: "rahul", password: "rahul" },
    { username: "sumant", password: "sumant" },
    { username: "rani", password: "rani" },
  ];

  //---------------------------functions-------------------------------------------------------

  const formSubmitHandler = async () => {
    try {
      const BASE_URL = process.env.REACT_APP_BASE_URL;
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        form: details,
      });

      const { accessToken, refreshToken, expiresIn } = res.data;
      // console.log(accessToken, refreshToken, expiresIn);
      sessionStorage.setItem("REFRESH_TOKEN", refreshToken);
      if (!context) {
        throw new Error("Context is not defined");
      }

      const setAuthDetails = context[1];
      setAuthDetails({
        USERNAME: details.username,
        TOKEN: accessToken,
        expiresIn: expiresIn,
      });
      // AuthDetails.USERNAME = details.username;
      // AuthDetails.TOKEN = accessToken;
      // AuthDetails.expiresIn = expiresIn;
      navigate("/");
    } catch (err: any) {
      setToastInfo({
        title: "Login error",
        description: err.message || "",
        type: "error",
      });
      setToastOpen(true);
      // console.log(err.message);
    }
  };

  const setUserHandler = (user: DetailType) => {
    setDetails(user);
  };

  //--------------------------useEffects-------------------------------------------------------
  useEffect(() => {
    const navigateToRootIfLoggedIn = () => {
      if (
        (context && context[0].TOKEN.length > 0) ||
        sessionStorage.getItem("REFRESH_TOKEN")
      ) {
        navigate("/");
      }
    };

    navigateToRootIfLoggedIn();
  }, []);
  return (
    <React.Fragment>
      <Toaster
        open={toastOpen}
        setOpen={setToastOpen}
        title={toastInfo.title}
        description={toastInfo.description}
        type={toastInfo.type}
      />
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
        <Tabs.Root
          className="flex flex-col w-[300px] shadow-[0_2px_10px] shadow-blackA2"
          defaultValue="tab1"
        >
          <Tabs.List
            className="shrink-0 flex border-b border-mauve6"
            aria-label="Manage your account"
          >
            <Tabs.Trigger
              className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
              value="tab1"
            >
              Login
            </Tabs.Trigger>
            <Tabs.Trigger
              className="bg-white px-5 h-[45px] flex-1 flex items-center justify-center text-[15px] leading-none text-mauve11 select-none first:rounded-tl-md last:rounded-tr-md hover:text-violet11 data-[state=active]:text-violet11 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black outline-none cursor-default"
              value="tab2"
            >
              Signup
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content
            className="grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
            value="tab1"
          >
            <fieldset className="mb-[15px] w-full flex flex-col justify-start">
              <label
                className="text-[13px] leading-none mb-2.5 text-violet12 block"
                htmlFor="username"
              >
                Username
              </label>
              <input
                className="grow shrink-0 rounded px-2.5 text-[15px] leading-none text-violet11 shadow-[0_0_0_1px] shadow-violet7 h-[35px] focus:shadow-[0_0_0_2px] focus:shadow-violet8 outline-none"
                id="username"
                placeholder="@peduarte"
                value={details.username}
                onChange={(e) =>
                  setDetails((details) => {
                    return { ...details, username: e.target.value };
                  })
                }
              />
            </fieldset>
            <fieldset className="mb-[15px] w-full flex flex-col justify-start">
              <label
                className="text-[13px] leading-none mb-2.5 text-violet12 block"
                htmlFor="Password"
              >
                Password
              </label>
              <input
                className="grow shrink-0 rounded px-2.5 text-[15px] leading-none text-violet11 shadow-[0_0_0_1px] shadow-violet7 h-[35px] focus:shadow-[0_0_0_2px] focus:shadow-violet8 outline-none"
                id="Password"
                type="password"
                placeholder="sldkjf23kj2@"
                value={details.password}
                onChange={(e) =>
                  setDetails((details) => {
                    return { ...details, password: e.target.value };
                  })
                }
              />
            </fieldset>
            <div className="flex flex-col gap-2 justify-between mt-5 items-stretch">
              {/* Button to add user details */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger className=" cursor-pointer">
                  <span className="p-2 bg-iconBg rounded active:bg-slate-300 flex items-center justify-center gap-2">
                    <span>Users</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                        fill="#5a5a65"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </span>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content className=" w-24 hover:cursor-default flex flex-col gap-1 p-1 bg-white  rounded  shadow-md">
                    {users.map((user) => (
                      <button
                        key={user.username}
                        onClick={() => setUserHandler(user)}
                        className=" text-start text-sm text-para hover:bg-violet11 hover:text-white p-1 rounded"
                      >
                        {user.username}
                      </button>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* Button to login */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  formSubmitHandler();
                }}
                className="inline-flex items-center justify-center rounded px-[15px] text-[15px] leading-none font-medium h-[35px] bg-green4 text-green11 hover:bg-green5 focus:shadow-[0_0_0_2px] focus:shadow-green7 outline-none cursor-default"
              >
                Login
              </button>
            </div>
          </Tabs.Content>
          <Tabs.Content
            className=" text-center text-para grow p-5 bg-white rounded-b-md outline-none focus:shadow-[0_0_0_2px] focus:shadow-black"
            value="tab2"
          >
            Signup is not available
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </React.Fragment>
  );
};

export default Authentication;
