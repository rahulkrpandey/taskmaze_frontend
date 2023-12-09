import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { v4 as uuid } from "uuid";
import axios from "axios";
import React from "react";
import Members from "../components/Members";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import Toaster, { ToastInfoType } from "../components/Toast";

interface ProjectType {
  title: string;
  desc: string;
  id: string;
}

enum Functions {
  CREATE_PROJECT,
  EDIT_PROJECT,
}

const Project = () => {
  const [newProject, setNewProject] = React.useState<{
    title: string;
    desc: string;
  }>({
    title: "",
    desc: "",
  });

  const [projects, setProjects] = React.useState<ProjectType[]>([]);

  const [showDeleteAlert, setShowDeleteAlert] = React.useState<boolean>(false);
  const [showDialog, setShowDialog] = React.useState<boolean>(false);

  const deleteProjectIdRef = React.useRef<string>("");
  const projectTitleRef = React.useRef<string>("");
  const dialogTitleRef = React.useRef<string>("");
  const dialogButtonTextRef = React.useRef<string>("");

  const currentFunctionRef = React.useRef<Functions>(Functions.CREATE_PROJECT);

  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_BASE_URL;

  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("context not available");
  }

  const [AuthDetails, setAuthDetails] = context;

  const [socket, setSocket] = React.useContext(SocketContext);

  const [toastOpen, setToastOpen] = React.useState<boolean>(false);
  const [toastInfo, setToastInfo] = React.useState<ToastInfoType>({
    title: "",
    description: "",
    type: "error",
  });

  //------------------- functions---------------------------------------------

  const callable = () => {
    switch (currentFunctionRef.current) {
      case Functions.CREATE_PROJECT:
        createNewProject();
        break;
      case Functions.EDIT_PROJECT:
        editProject();
        break;
      default:
        break;
    }
  };

  const editProject = async () => {
    try {
      const TOKEN = AuthDetails.TOKEN;
      const res = await axios.put(
        `${BASE_URL}/${deleteProjectIdRef.current}`,
        {
          data: {
            id: deleteProjectIdRef.current,
            title: newProject.title,
            description: newProject.desc,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );

      // console.log(res);

      setProjects((projects) =>
        projects.map((item) => {
          if (item.id === deleteProjectIdRef.current) {
            item.title = newProject.title;
            item.desc = newProject.desc;
          }
          return item;
        })
      );
    } catch (e: any) {
      // console.log(e);
    }
  };

  const createNewProject = async () => {
    const TOKEN = AuthDetails.TOKEN;
    try {
      if (newProject.title.length === 0) {
        // console.log("Title is empty");
        return;
      }
      const temp: ProjectType = {
        ...newProject,
        id: uuid(),
      };

      await axios.post(
        `${BASE_URL}/projects`,
        {
          data: {
            id: temp.id,
            title: temp.title,
            description: temp.desc,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );

      // setProjects((projects) => {
      //   const t = [...projects];
      //   t.unshift(temp);
      //   return t;
      // });
      setProjects((projects) => [temp, ...projects]);

      setToastInfo({
        title: "Project created successfully",
        description: "",
        type: "success",
      });

      setToastOpen(true);

      socket?.emit("create_project", temp);
    } catch (e: any) {
      // console.log(e);
      setToastInfo({
        title: "Project Could not be created",
        description: e.message || "",
        type: "error",
      });

      setToastOpen(true);
    }
  };

  const deleteProject = async () => {
    if (deleteProjectIdRef.current.length === 0) return;

    try {
      const TOKEN = AuthDetails.TOKEN;
      await axios.delete(`${BASE_URL}/projects/${deleteProjectIdRef.current}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      setProjects((projects) =>
        projects.filter((item) => item.id !== deleteProjectIdRef.current)
      );
    } catch (e) {
      // console.log(e);
    }
  };

  const openKanbanBoard = async (pid: string) => {
    try {
      navigate(pid);
    } catch (err: any) {
      // console.log(err);
      setToastInfo({
        title: "Could not open project",
        description: err.message || "",
        type: "error",
      });

      setToastOpen(true);
    }
  };

  //-------------------useEffects----------------------------------------------

  React.useEffect(() => {
    const clearNewProjectValues = () => {
      setNewProject({
        desc: "",
        title: "",
      });
    };

    if (newProject.title.length > 0) clearNewProjectValues();

    deleteProjectIdRef.current = "";
    projectTitleRef.current = "";
  }, [projects]);

  React.useEffect(() => {
    // console.log(newProject);
  }, [newProject]);

  React.useEffect(() => {
    // console.log(AuthDetails);
    const initialise = async () => {
      try {
        const TOKEN = AuthDetails.TOKEN;
        // console.log("token", TOKEN);
        const { data } = await axios.get(`${BASE_URL}/projects`, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        });
        // console.log(data);
        setProjects(
          data.map(
            (item: { id: string; title: string; description: string }) => {
              return {
                ...item,
                desc: item.description,
              };
            }
          )
        );
      } catch (err: any) {
        // console.log(err);
      }
    };

    initialise();
  }, [AuthDetails, setAuthDetails]);

  React.useEffect(() => {
    if (!socket) return;
    socket.on("create_project", (args: any) => {
      // console.log("created...");
      setProjects((projects) => [args, ...projects]);
    });

    socket.on("delete_project", (projectId: string) => {
      setProjects((projects) =>
        projects.filter((item) => item.id !== projectId)
      );
    });

    socket.on("update_project", (arg: any) => {
      const { id, title, description } = arg;
      setProjects((projects) =>
        projects.map((item) => {
          if (item.id == id) {
            return {
              id,
              title,
              desc: description,
            };
          }

          return item;
        })
      );
    });
  }, [socket, setSocket]);

  return (
    <React.Fragment>
      {/* Taster to report errors or status */}
      <Toaster
        open={toastOpen}
        setOpen={setToastOpen}
        title={toastInfo.title}
        description={toastInfo.description}
        type={toastInfo.type}
      />
      <div>
        {/* Modal to confirm delete [not being used now] */}
        <AlertDialog.Root open={showDeleteAlert}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
            <AlertDialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
              <AlertDialog.Title className="text-mauve12 m-0 text-[17px] font-medium">
                Deleting Project: {projectTitleRef.current}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-mauve11 mt-4 mb-5 text-[15px] leading-normal">
                This action cannot be undone. This will permanently delete this
                project.
              </AlertDialog.Description>
              <div className="flex justify-end gap-[25px]">
                <AlertDialog.Cancel asChild>
                  <button
                    onClick={() => setShowDeleteAlert(false)}
                    className="text-mauve11 bg-mauve4 hover:bg-mauve5 focus:shadow-mauve7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                  >
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={() => {
                      deleteProject();
                      setShowDeleteAlert(false);
                    }}
                    className="text-red11 bg-red4 hover:bg-red5 focus:shadow-red7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                  >
                    Yes, delete project
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        {/* Modal to create new project and edit existing project */}
        <Dialog.Root open={showDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
            <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
              <Dialog.Title className="text-mauve12 m-0 mb-4 text-[17px] font-medium">
                {/* Add new project */}
                {dialogTitleRef.current}
              </Dialog.Title>
              <fieldset className="flex flex-col items-start gap-2 justify-between mb-6">
                <label
                  // className="text-violet11 text-right text-[15px] "
                  className=" resize-none text-base font-semibold text-heading focus "
                  htmlFor="username"
                >
                  Title
                </label>
                <input
                  // className="  text-violet11 shadow-violet7 focus:shadow-violet8 inline-flex p-2 w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                  className="p-2 w-full resize-none text-base text-heading outline-[1px] outline-inputBorder border-[1px] border-inputBorder rounded"
                  value={newProject.title}
                  onChange={(e) => {
                    setNewProject((item) => {
                      return {
                        ...item,
                        title: e.target.value,
                      };
                    });
                  }}
                />
              </fieldset>
              <fieldset className="flex flex-col items-start gap-2 justify-between">
                <label
                  className=" resize-none text-base font-semibold text-heading focus "
                  // className="text-violet11 text-right text-[15px] "
                  htmlFor="username"
                >
                  Description
                </label>
                <input
                  // className="  text-violet11 shadow-violet7 focus:shadow-violet8 inline-flex p-2 w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                  className="p-2 w-full resize-none text-base text-heading outline-[1px] outline-inputBorder border-[1px] border-inputBorder rounded"
                  value={newProject.desc}
                  onChange={(e) =>
                    setNewProject((item) => {
                      return {
                        ...item,
                        desc: e.target.value,
                      };
                    })
                  }
                />
              </fieldset>
              <div className="mt-[25px] flex justify-end">
                <Dialog.Close asChild>
                  <button
                    onClick={() => {
                      callable();
                      // createNewProject();
                      setShowDialog(false);
                    }}
                    className=" w-full bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
                  >
                    {/* Add Project */}
                    {dialogButtonTextRef.current}
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Close asChild>
                <button
                  onClick={() => {
                    setShowDialog(false);
                  }}
                  className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                  aria-label="Close"
                >
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Project title */}
        <div className=" mx-auto w-3/5 mb-6 flex justify-between items-end gap-4">
          <div>
            <h1 className=" text-2xl md:text-4xl text-heading font-bold mb-2">
              Projects
            </h1>
            <p className=" text-xs md:text-sm mb-1 text-para font-normal">
              All the projects will be shown here!
            </p>
            {/* <Members /> */}
          </div>
          {/* button to add new project */}
          <button
            onClick={() => {
              dialogTitleRef.current = "Add New Project";
              dialogButtonTextRef.current = "Add Project";
              currentFunctionRef.current = Functions.CREATE_PROJECT;
              setShowDialog(true);
            }}
            className=" bg-iconBg rounded active:bg-slate-300 "
          >
            <svg
              // width="32"
              // height="32"
              className=" w-6 h-6 md:w-8 md:h-8"
              viewBox="0 0 15 15"
              fill=" #E1E4E8"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                // fill="currentColor"
                fill=" #5A5A65"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>

        {/* list of projects */}
        <ScrollArea.Root className="mx-auto w-3/5 h-[450px] md:h-[500px] rounded overflow-hidden">
          <ScrollArea.Viewport className="w-full h-full">
            {/* <ScrollArea.Viewport className=" w-full h-full p-5 bg-background rounded-md"> */}
            <div className=" w-full p-5 bg-background rounded-md">
              {projects.map((item) => (
                <div
                  onClick={() => openKanbanBoard(item.id)}
                  key={item.id}
                  className=" mb-2 hover:cursor-pointer"
                >
                  <div className="p-4 flex justify-between items-start bg-white rounded-md shadow-md">
                    <div>
                      <h2 className=" text-sm md:text-base font-semibold  mb-2">
                        {item.title}
                      </h2>
                      <p className=" text-[10px] md:text-[14px] text-para">
                        {item.desc}
                      </p>
                    </div>
                    {/* <div className=" flex gap-4 justify-center items-center ">
                    //  button for edit operation 
                    <button
                      onClick={() => {
                        currentFunctionRef.current = Functions.EDIT_PROJECT;
                        deleteProjectIdRef.current = item.id;
                        dialogTitleRef.current = "Edit Project";
                        dialogButtonTextRef.current = "Save";
                        setNewProject({
                          desc: item.desc,
                          title: item.title,
                        });

                        setShowDialog(true);
                      }}
                      className=" rounded bg-iconBg p-2 active:bg-slate-300"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
                          fill=" #5A5A65"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>

                    // button for delete operation 
                    <button
                      onClick={() => {
                        deleteProjectIdRef.current = item.id;
                        projectTitleRef.current = item.title;
                        setShowDeleteAlert(true);
                      }}
                      className=" rounded p-2 bg-iconBg active:bg-slate-300"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z"
                          fill=" #5A5A65"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                  </div> */}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea.Viewport>

          <ScrollArea.Scrollbar
            className="flex select-none touch-none p-0.5 bg-blackA3 transition-colors duration-[160ms] ease-out hover:bg-blackA5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Scrollbar
            className="flex select-none touch-none p-0.5 bg-blackA3 transition-colors duration-[160ms] ease-out hover:bg-blackA5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
            orientation="horizontal"
          >
            <ScrollArea.Thumb className="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
          </ScrollArea.Scrollbar>
          <ScrollArea.Corner className="bg-blackA5" />
        </ScrollArea.Root>
      </div>
    </React.Fragment>
  );
};
export default Project;
