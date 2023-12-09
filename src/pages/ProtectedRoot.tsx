import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { io, Socket } from "socket.io-client";

const ProtectedRoot = () => {
  const initialiseRef = React.useRef<boolean>(false);
  const navigate = useNavigate();
  const context = React.useContext(AuthContext);
  const prevTimeoutRef = React.useRef<any>(null);
  if (!context) {
    throw new Error("Context is undefined");
  }

  const [AuthDetails, setAuthDetails] = context;
  const [socket, setSocket] = React.useContext(SocketContext);

  // ------------------------------------------useEffects---------------------------
  React.useEffect(() => {
    if (initialiseRef.current) return;
    initialiseRef.current = true;
    const initialiseData = async () => {
      // console.log("initialising protected root");
      if (AuthDetails.TOKEN.length === 0) {
        try {
          const REFRESH_URL = process.env.REACT_APP_REFRESH_URL;
          
          const res = await axios.post(`${REFRESH_URL}`, {
            data: {
              refreshToken: sessionStorage.getItem("REFRESH_TOKEN"),
            },
          });

          // console.log(res.data);

          const token = res.data.accessToken;
          const expiresIn = res.data.expiresIn;
          const username = res.data.username;
          if (!token || !expiresIn || !username) {
            throw new Error("Token or time is invalid");
          }

          //   AuthDetails.TOKEN = token;
          //   AuthDetails.expiresIn = expiresIn;
          //   AuthDetails.USERNAME = username;
          setAuthDetails({
            TOKEN: token,
            expiresIn: expiresIn,
            USERNAME: username,
          });

          if (prevTimeoutRef.current) {
            clearTimeout(prevTimeoutRef.current);
          }

          prevTimeoutRef.current = setTimeout(() => {
            initialiseData();
          }, expiresIn * 1000 - 500);
        } catch (err) {
          // console.log(err);
          sessionStorage.removeItem("REFRESH_TOKEN");
          navigate("/auth");
        }
      }
    };

    initialiseData();
  }, []);

  React.useEffect(() => {
    const initialiseSocket = () => {
      try {
        if (!setSocket) {
          // console.log("set socket is undefined");
          return;
        }

        const TEMP_URL = process.env.REACT_APP_BASE_URL || "";
        const BASE_URL = TEMP_URL.split("/api")[0];
        const TOKEN = AuthDetails.TOKEN;
        // console.log(TOKEN);
        const socket = io(BASE_URL, {
          auth: {
            TOKEN,
          },
        });

        socket.on("connect_error", (err) => {
          // console.log(err instanceof Error);
          // console.log(err.message);
          // setTimeout(() => {
          //   initialiseSocket();
          // }, 1000);
        });

        socket.on("connect", () => {
          console.log("user is connected on client");
        });

        setSocket(socket);
      } catch (err: any) {
        // console.log(err);
        setTimeout(() => {
          initialiseSocket();
        }, 1000);
      }
    };

    initialiseSocket();
  }, [AuthDetails, setAuthDetails]);

  return (
    <div>
      <Nav />
      <Outlet />
    </div>
  );
};

export default ProtectedRoot;
