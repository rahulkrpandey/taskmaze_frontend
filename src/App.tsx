import React, { useEffect, useState } from "react";
import Project from "./pages/Project";
import Kanban from "./pages/Kanban";
import Card from "./components/Card";
import Nav from "./components/Nav";
import Authentication from "./pages/Authentication";
import { Socket, io } from "socket.io-client";

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  custom_event: (arg: any) => void;
}

function App() {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents>>();

  useEffect(() => {
    const init = async () => {
      const socket = io("http://localhost:5000/", {
        auth: {
          TOKEN: "this is token",
        },
      });

      socket.on("connect_error", (err) => {
        console.log(err instanceof Error);
        console.log(err.message);
        // setTimeout(() => {
        //   socket.connect();
        // }, 1000)
      });

      socket.on("connect", () => {
        console.log("user is connected on client");
      });

      socket.on("custom_event", (args) => {
        console.log("client", args);
      });

      setSocket(socket);
    };

    init();
  }, []);

  const sendEvent = async () => {
    if (socket) {
      socket.emit("custom_event", "this is any state");
    }
  };

  return (
    <div className="">
      <p>this is button</p>
      <button onClick={sendEvent} className="p-2 bg-teal-600 text-white">
        click me
      </button>
    </div>
  );
}

export default App;
