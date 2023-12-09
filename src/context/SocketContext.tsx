import React, { ReactNode } from "react";
import { Socket } from "socket.io-client";

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  custom_event: (arg: any) => void;
  create_project: (arg: any) => void;
  update_project: (arg: any) => void;
  delete_project: (projectId: string) => void;
  update_kanban: (arg: any) => void;
}

interface ClientToServerEvents {
  custom_event: (arg: any) => void;
  create_project: (arg: any) => void;
  update_project: (arg: any) => void;
  delete_project: (projectId: string) => void;
  update_kanban: (arg: any) => void;
}
export const SocketContext = React.createContext<
  [
    Socket<ServerToClientEvents, ClientToServerEvents> | undefined,
    (
      | React.Dispatch<
          React.SetStateAction<
            Socket<ServerToClientEvents, ClientToServerEvents> | undefined
          >
        >
      | undefined
    )
  ]
>([undefined, undefined]);

export const SocketContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const context =
    React.useState<Socket<ServerToClientEvents, ClientToServerEvents>>();
  return (
    <SocketContext.Provider value={context}>{children}</SocketContext.Provider>
  );
};
