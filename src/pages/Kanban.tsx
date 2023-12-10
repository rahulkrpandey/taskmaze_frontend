import React, { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Cross2Icon } from "@radix-ui/react-icons";
import Card from "../components/Card";
import { Label, Tag } from "../components/Tag";
import { COLORS } from "../components/Utility";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DragDropContext,
  Draggable,
  DropResult,
  Droppable,
  DroppableProps,
  Direction,
} from "react-beautiful-dnd";
import { v4 as uuid } from "uuid";
import axios, { AxiosError } from "axios";
import Members from "../components/Members";
import { AuthContext } from "../context/AuthContext";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { SocketContext } from "../context/SocketContext";
import Toaster, { ToastInfoType } from "../components/Toast";
import * as Switch from "@radix-ui/react-switch";

enum Priority {
  LOW = "#f59e0b",
  MEDIUM = "#6366f1",
  HIGH = "#e11d48",
}

interface CardDataType {
  title: string;
  desc: string;
  date: number;
  tags: { label: string; color: string }[];
  priority: Priority;
  id: string;
  order: number;
  columnId: string;
}

interface ApiDataType {
  title: string;
  description: string;
  date: Date;
  tag_ids: { label: string; color: string }[];
  priority: string;
  id: string;
  order: number;
  column_id: string;
  project_id: string;
}

interface KanbanDataType {
  tasks: {
    [id: string]: CardDataType;
  };
  columns: {
    [id: string]: {
      id: string;
      title: string;
      color: string;
      taskIds: string[];
    };
  };
  columnOrder: string[];
  projectTitle: string;
  projectDescription: string;
}

const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = React.useState(false);
  React.useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

const Kanban = () => {
  const param = useParams();
  const pid: string = param.pid ? param.pid : "";
  const BASE_URL = `${process.env.REACT_APP_BASE_URL}/tasks`;
  // console.log(BASE_URL);
  const [currentCard, setCurrentCard] = React.useState<CardDataType>({
    title: "title",
    desc: "desc lskdjf lsdkfj sldkfjsldf ",
    date: 0,
    tags: [],
    priority: Priority.LOW,
    id: "id1",
    order: 0,
    columnId: "ToDo",
  });

  const [addTaskContent, setAddTaskContent] = React.useState<CardDataType>({
    title: "",
    desc: "",
    date: Date.now(),
    tags: [],
    priority: Priority.HIGH,
    id: "",
    order: 0,
    columnId: "ToDo",
  });

  const [kanbnData, setKanbanData] = React.useState<KanbanDataType>({
    tasks: {
      // id1: {
      //   id: "id1",
      //   title: "1",
      //   desc: "11",
      //   date: Date.now(),
      //   tags: [],
      //   order: 0,
      //   priority: Priority.HIGH,
      //   columnId: "ToDo",
      // },
      // id2: {
      //   id: "id2",
      //   title: "2",
      //   desc: "22",
      //   date: Date.now(),
      //   tags: [],
      //   order: 0,
      //   priority: Priority.HIGH,
      //   columnId: "ToDo",
      // },
      // id3: {
      //   id: "id3",
      //   title: "3",
      //   desc: "33",
      //   date: Date.now(),
      //   tags: [],
      //   order: 0,
      //   priority: Priority.HIGH,
      //   columnId: "InProgress",
      // },
      // id4: {
      //   id: "id4",
      //   title: "4",
      //   desc: "44",
      //   date: Date.now(),
      //   tags: [],
      //   order: 0,
      //   priority: Priority.HIGH,
      //   columnId: "InProgress",
      // },
      // id5: {
      //   id: "id5",
      //   title: "5",
      //   desc: "55",
      //   date: Date.now(),
      //   tags: [],
      //   order: 0,
      //   priority: Priority.HIGH,
      //   columnId: "Done",
      // },
      // id6: {
      //   id: "id6",
      //   title: "6",
      //   desc: "66",
      //   date: Date.now(),
      //   tags: [],
      //   order: 0,
      //   priority: Priority.HIGH,
      //   columnId: "Done",
      // },
    },
    columns: {
      // ToDo: { id: "ToDo", title: "To Do", taskIds: ["id1", "id2"] },
      // InProgress: { id: "InProgress", title: "To Do", taskIds: ["id3", "id4"] },
      // Done: { id: "Done", title: "To Do", taskIds: ["id5", "id6"] },
      ToDo: { id: "ToDo", title: "To Do", color: COLORS["TAG3"], taskIds: [] },
      InProgress: {
        id: "InProgress",
        title: "In Progress",
        color: COLORS["TAG2"],
        taskIds: [],
      },
      Done: { id: "Done", title: "Done", color: COLORS["TAG4"], taskIds: [] },
    },
    columnOrder: ["ToDo", "InProgress", "Done"],
    projectTitle: "",
    projectDescription: "",
  });

  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("Context is undefined");
  }

  const [AuthDetails, setAuthDetails] = context;
  const [socket, setSocket] = React.useContext(SocketContext);

  const navigate = useNavigate();

  const scrollRef = React.useRef<any>(null);
  const dataInitialisedRef = React.useRef<boolean>(false);
  const addedElementRef = React.useRef<boolean>(false);
  const sendDataRef = React.useRef<boolean>(false);
  const [showDialog, setShowDialog] = React.useState<boolean>(false);
  const [showAddTask, setShowAddTask] = React.useState<boolean>(false);
  const [showProjectDeleteAlert, setShowProjectDeleteAlert] =
    React.useState<boolean>(false);
  const [showCardDeleteAlert, setShowCardDeleteAlert] =
    React.useState<boolean>(false);
  const [showProjectEditDialog, setShowProjectEditDialog] =
    React.useState<boolean>(false);
  const [dialogState, setDialogState] = React.useState<{
    titleFocus: boolean;
    descFocus: Boolean;
  }>({ titleFocus: false, descFocus: false });

  const [toastOpen, setToastOpen] = React.useState<boolean>(false);
  const [horizontalListSelected, setHorizontalListSelected] =
    React.useState<boolean>(false);
  const [toastInfo, setToastInfo] = React.useState<ToastInfoType>({
    title: "",
    description: "",
    type: "error",
  });

  const availableTags = [
    { label: "tag1", color: COLORS["TAG1"] },
    { label: "tag2", color: COLORS["TAG2"] },
    { label: "tag3", color: COLORS["TAG3"] },
    { label: "tag4", color: COLORS["TAG4"] },
    { label: "tag5", color: COLORS["TAG5"] },
  ];

  // ---------------------------functions-------------------------------------------------------------

  const saveHandler = async () => {
    // setShowDialog(false);
    let same = true;
    Object.values(kanbnData.tasks).forEach((card) => {
      if (card.id === currentCard.id) {
        if (
          card.title !== currentCard.title ||
          card.desc !== currentCard.desc ||
          card.priority !== currentCard.priority ||
          card.date !== currentCard.date
        ) {
          same = false;
        }

        same = same && card.tags.length === currentCard.tags.length;
        for (let i = 0; i < card.tags.length && same; i++) {
          let found = false;
          for (let j = 0; j < currentCard.tags.length; j++) {
            if (card.tags[i].label === currentCard.tags[j].label) {
              found = true;
              break;
            }
          }

          if (!found) {
            same = false;
            break;
          }
        }
      }
    });

    if (!same) {
      try {
        const apiData: ApiDataType = {
          id: currentCard.id,
          title: currentCard.title,
          description: currentCard.desc,
          tag_ids: currentCard.tags,
          order: currentCard.order,
          priority: currentCard.priority,
          date: new Date(currentCard.date),
          project_id: pid,
          column_id: currentCard.columnId,
        };

        const TOKEN = AuthDetails.TOKEN;

        await axios.put(
          `${BASE_URL}/${currentCard.id}`,
          {
            data: apiData,
          },
          {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          }
        );
        setKanbanData((data) => {
          data.tasks[currentCard.id] = currentCard;
          return { ...data };
        });

        setToastInfo({
          title: "Task updated successfully",
          description: "",
          type: "success",
        });

        setToastOpen(true);

        sendDataRef.current = true;
      } catch (err: any) {
        setToastInfo({
          title: "Task could not be updated",
          description: err.message || "",
          type: "error",
        });

        setToastOpen(true);
        console.log(err);
      }
    } else {
      // console.log("same");
      setShowDialog(false);
    }
  };

  const addTaskHandler = async () => {
    try {
      addTaskContent.id = uuid();
      const apidata: ApiDataType = {
        id: addTaskContent.id,
        title: addTaskContent.title,
        description: addTaskContent.desc,
        date: new Date(addTaskContent.date),
        priority: addTaskContent.priority,
        project_id: pid,
        tag_ids: addTaskContent.tags,
        order: kanbnData.columns["ToDo"].taskIds.length,
        column_id: "ToDo",
      };

      const TOKEN = AuthDetails.TOKEN;
      await axios.post(
        `${BASE_URL}/`,
        {
          data: apidata,
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );

      sendDataRef.current = true;

      setKanbanData((data) => {
        data.tasks[addTaskContent.id] = addTaskContent;
        data.columns["ToDo"].taskIds.push(addTaskContent.id);
        return {
          ...data,
        };
      });

      setToastInfo({
        title: "Task added successfully",
        description: "",
        type: "error",
      });

      setToastOpen(true);

      addedElementRef.current = true;
    } catch (err: any) {
      setToastInfo({
        title: "Task could not be added",
        description: err.message || "",
        type: "error",
      });

      setToastOpen(true);
      console.log(err);
    }
  };

  const deleteTaskHandler = async (id: string) => {
    try {
      const TOKEN = AuthDetails.TOKEN;
      const res = await axios.delete(`${BASE_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      // console.log(res);
      setShowCardDeleteAlert(false);
      setShowDialog(false);
      setKanbanData((data) => {
        const tid = currentCard.id;
        if (!data.tasks[tid]) {
          return { ...data };
        }

        data.columns[data.tasks[tid].columnId].taskIds = data.columns[
          // data.columns[currentCard.columnId].taskIds = data.columns[
          // currentCard.columnId
          data.tasks[tid].columnId
        ].taskIds.filter((id) => id !== tid);

        delete data.tasks[tid];

        // console.log(currentCard.columnId);
        // console.log(data);
        return { ...data };
      });

      setToastInfo({
        title: "Task deleted successfully",
        description: "",
        type: "success",
      });

      setToastOpen(true);

      sendDataRef.current = true;
    } catch (err: any) {
      setToastInfo({
        title: "Task could no be deleted",
        description: err.message || "",
        type: "error",
      });

      setToastOpen(true);
      console.log(err);
    }
  };

  const dragEndHandler = async (context: DropResult) => {
    try {
      // console.log(context);
      const { source, destination } = context;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      const tempData: {
        [id: string]: string[];
      } = {};

      setKanbanData((kanbnData) => {
        Object.keys(kanbnData.columns).forEach((col) => {
          const newArr = [...kanbnData.columns[col].taskIds];
          tempData[col] = newArr;
        });

        return kanbnData;
      });

      const id = tempData[source.droppableId][source.index];
      tempData[source.droppableId].splice(source.index, 1);
      tempData[destination.droppableId].splice(destination.index, 0, id);

      const sendData: ApiDataType[] = [];
      Object.keys(tempData).forEach((col) =>
        tempData[col].forEach((taskId, idx) => {
          const item: ApiDataType = {
            id: taskId,
            order: idx,
            column_id: col,
            date: new Date(kanbnData.tasks[taskId].date),
            // date: kanbnData.tasks[taskId].date,
            title: kanbnData.tasks[taskId].title,
            description: kanbnData.tasks[taskId].desc,
            tag_ids: kanbnData.tasks[taskId].tags,
            priority: kanbnData.tasks[taskId].priority,
            project_id: pid,
          };

          sendData.push(item);
        })
      );
      // console.log(sendData);

      const TOKEN = AuthDetails.TOKEN;
      axios
        .put(
          `${BASE_URL}/all`,
          {
            data: sendData,
          },
          {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          }
        )
        .catch((err) => {
          throw err;
        });

      sendDataRef.current = true;
      setKanbanData((kanbnData) => {
        const id = kanbnData.columns[source.droppableId].taskIds[source.index];
        kanbnData.columns[source.droppableId].taskIds.splice(source.index, 1);
        kanbnData.columns[destination.droppableId].taskIds.splice(
          destination.index,
          0,
          id
        );

        kanbnData.tasks[id].columnId = destination.droppableId;

        Object.keys(kanbnData.columns).forEach((col) => {
          kanbnData.columns[col].taskIds.forEach((ids, idx) => {
            kanbnData.tasks[ids].order = idx;
          });
        });
        return { ...kanbnData };
      });
    } catch (err: any) {
      setToastInfo({
        title: "Out of sync",
        description: err.message || "",
        type: "error",
      });
      setToastOpen(true);
      console.log(err);
    }
  };

  const saveTitleAndDescriptionHandler = async () => {
    try {
      const BASE_URL = `${process.env.REACT_APP_BASE_URL}/projects`;
      const TOKEN = AuthDetails.TOKEN;
      const res = await axios.put(
        `${BASE_URL}/${pid}`,
        {
          data: {
            id: pid,
            title: kanbnData.projectTitle,
            description: kanbnData.projectDescription,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );

      console.log(res);
      setToastInfo({
        title: "Project info changed successfully",
        description: "",
        type: "success",
      });

      setToastOpen(true);

      socket?.emit("update_project", {
        id: pid,
        title: kanbnData.projectTitle,
        description: kanbnData.projectDescription,
      });
      setShowProjectEditDialog(false);
    } catch (err: any) {
      setToastInfo({
        title: "Project info could not be changed",
        description: err.message || "",
        type: "error",
      });

      setToastOpen(true);
      console.log(err);
    }
  };

  const deleteProjectHandler = async () => {
    try {
      const BASE_URL = `${process.env.REACT_APP_BASE_URL}/projects`;
      const TOKEN = AuthDetails.TOKEN;
      const res = await axios.delete(`${BASE_URL}/${pid}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      // console.log(res);
      socket?.emit("delete_project", pid);
      navigate("/");
    } catch (err: any) {
      console.log(err);
      setToastInfo({
        title: "Project info could not be deleted",
        description: err.message || "",
        type: "error",
      });

      setToastOpen(true);
    }
  };

  // --------------------------useEffects-------------------------------------------------------------

  React.useEffect(() => {
    const showDialogWhenCardClicked = () => {
      if (currentCard.title.length > 0 && !showDialog) {
        setShowDialog(true);
      }
    };

    showDialogWhenCardClicked();
  }, [currentCard, setCurrentCard, setShowDialog]);

  React.useEffect(() => {
    const func = () => {
      // console.log(kanbnData);
      setShowDialog(false);
      setShowAddTask(false);
      if (addTaskContent.title.length > 0) {
        setAddTaskContent({
          title: "",
          desc: "",
          id: "",
          date: Date.now(),
          tags: [],
          order: 0,
          priority: Priority.HIGH,
          columnId: "ToDo",
        });
      }

      if (scrollRef.current && addedElementRef.current) {
        addedElementRef.current = false;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }

      if (sendDataRef.current) {
        sendDataRef.current = false;
        socket?.emit("update_kanban", {
          projectId: pid,
          kanban: kanbnData,
        });
      }
    };

    func();
  }, [kanbnData, setKanbanData]);

  React.useEffect(() => {
    const initialiserData = async () => {
      try {
        const TOKEN = AuthDetails.TOKEN;
        // console.log("initialising", AuthDetails);
        const res = await axios.get(`${BASE_URL}/${pid}`, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        });

        const apiData: ApiDataType[] = res.data.tasks;
        const projectDetails = res.data.project;
        kanbnData.projectTitle = projectDetails.title;
        kanbnData.projectDescription = projectDetails.description;

        // console.log(apiData);

        // console.log(kanbnData.columns["ToDo"].taskIds.length);
        apiData.forEach((item) => {
          const card: CardDataType = {
            id: item.id,
            desc: item.description,
            title: item.title,
            priority: Priority.LOW,
            date: new Date(item.date).getTime(),
            // date: item.date.getTime(),
            order: item.order,
            tags: item.tag_ids,
            columnId: item.column_id,
          };

          switch (item.priority.toUpperCase()) {
            case "HIGH":
              card.priority = Priority.HIGH;
              break;
            case "MEDIUM":
              card.priority = Priority.MEDIUM;
              break;
            default:
              break;
          }

          kanbnData.tasks[item.id] = card;
          kanbnData.columns[item.column_id].taskIds.push(item.id);
        });
        // console.log("data initialised");
        // console.log(kanbnData.columns["ToDo"].taskIds.length);
        setKanbanData({ ...kanbnData });
      } catch (err) {
        const error = err as AxiosError;
        if (error.response && error.response.status === 404) {
          navigate("/");
        }
        dataInitialisedRef.current = false;
        console.log(err);
      }
    };

    if (!dataInitialisedRef.current) {
      dataInitialisedRef.current = true;
      initialiserData();
    }
  }, [AuthDetails, setAuthDetails]);

  React.useEffect(() => {
    const initialiseSocket = async () => {
      try {
        socket?.on("update_project", (arg: any) => {
          const { id, title, description } = arg;
          if (pid !== id) {
            return;
          }
          setKanbanData((data) => {
            data.projectTitle = title;
            data.projectDescription = description;
            return { ...data };
          });
        });

        socket?.on("delete_project", (projectId: string) => {
          // console.log(projectId);
          if (pid === projectId) {
            navigate("/");
          }
        });

        socket?.on("update_kanban", (arg: any) => {
          const { projectId, kanban } = arg;
          if (pid === projectId) {
            setKanbanData(kanban);
          }
        });
      } catch (err: any) {
        console.log(err);
      }
    };

    initialiseSocket();
  }, [socket, setSocket]);

  return (
    <React.Fragment>
      <Toaster
        open={toastOpen}
        setOpen={setToastOpen}
        title={toastInfo.title}
        description={toastInfo.description}
        type={toastInfo.type}
      />
      <div>
        {/* Modal for editing cards */}
        <Dialog.Root open={showDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
            <Dialog.Content
              onOpenAutoFocus={(e) => e.preventDefault()}
              className=" data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] py-8 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
            >
              <div className=" flex flex-col gap-2 ">
                {!dialogState.titleFocus && (
                  <h1
                    onClick={() => {
                      setDialogState((status) => {
                        return { ...status, titleFocus: true };
                      });
                    }}
                    className={` text-base font-bold text-heading w-full ${
                      currentCard.title.length === 0 && "text-slate-300"
                    }`}
                  >
                    {currentCard.title || "title"}
                  </h1>
                )}
                {dialogState.titleFocus && (
                  <textarea
                    placeholder="title"
                    rows={4}
                    autoFocus
                    onFocus={(e) => {
                      e.target.setSelectionRange(0, e.target.value.length);
                    }}
                    className=" border-[1px] border-black rounded p-2 resize-none text-base font-semibold text-heading focus outline-none"
                    onBlur={() => {
                      setDialogState((status) => {
                        return { ...status, titleFocus: false };
                      });
                    }}
                    value={currentCard.title}
                    onChange={(e) => {
                      setCurrentCard((currentCard) => {
                        return { ...currentCard, title: e.target.value };
                      });
                    }}
                  />
                )}

                {!dialogState.descFocus && (
                  <p
                    onClick={() =>
                      setDialogState((state) => {
                        return { ...state, descFocus: true };
                      })
                    }
                    className={` resize-none text-sm font-normal text-para outline-none  h-full ${
                      currentCard.desc.length === 0 && "text-slate-300"
                    }`}
                  >
                    {currentCard.desc || "description"}
                  </p>
                )}
                {dialogState.descFocus && (
                  <textarea
                    autoFocus
                    onFocus={(e) => {
                      e.target.setSelectionRange(0, e.target.value.length);
                    }}
                    rows={4}
                    onBlur={() =>
                      setDialogState((state) => {
                        return { ...state, descFocus: false };
                      })
                    }
                    className="p-2 border-black border-[1px] rounded resize-none text-sm font-normal text-para outline-none  h-full"
                    value={currentCard.desc}
                    onChange={(e) => {
                      setCurrentCard((currentCard) => {
                        return { ...currentCard, desc: e.target.value };
                      });
                    }}
                  />
                )}

                {/* Date section */}
                <div className=" flex gap-2">
                  <div
                    style={{ backgroundColor: COLORS["TAG2"] }}
                    className={` flex gap-2  text-base font-semibold py-1 px-3 rounded-lg max-w-fit justify-between `}
                  >
                    <div className=" text-[#4d4d4d]">Due</div>
                    <div className="datepicker-container">
                      <DatePicker
                        className={`outline-none w-10 bg-[#FFDCE0] hover:cursor-pointer text-[#4d4d4d]`}
                        dateFormat={"dd/MM"}
                        autoFocus={false}
                        selected={new Date(currentCard.date)}
                        onChange={(date) => {
                          if (!date) return;
                          setCurrentCard((card) => {
                            return { ...card, date: date.getTime() };
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* tag Section */}
                <div className=" flex gap-2 flex-wrap justify-start items-center">
                  {currentCard.tags.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setCurrentCard((currentCard) => {
                          return {
                            ...currentCard,
                            tags: currentCard.tags.filter(
                              (tag) => tag.label !== item.label
                            ),
                          };
                        });
                      }}
                    >
                      <Tag label={item.label} color={item.color} />
                    </button>
                  ))}

                  {/* Section to add more tags */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild className=" cursor-pointer">
                      <button className="p-1 bg-iconBg rounded active:bg-slate-300">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                            fill="#5a5a65"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className=" hover:cursor-default flex flex-col gap-4 bg-white rounded px-2 py-1 shadow-md">
                        {availableTags.map((tag) => (
                          <button
                            onClick={() => {
                              let found = false;
                              currentCard.tags.forEach((item) => {
                                if (item.label === tag.label) {
                                  found = true;
                                }
                              });

                              if (found) return;

                              setCurrentCard((currentCard) => {
                                return {
                                  ...currentCard,
                                  tags: [tag, ...currentCard.tags],
                                };
                              });
                            }}
                            key={tag.label}
                            className=""
                          >
                            <Tag label={tag.label} color={tag.color} />
                          </button>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>

                {/* Priority Section */}
                <div className=" flex gap-4">
                  <span className=" text-sm font-semibold">Priority:</span>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild className=" cursor-pointer">
                      <button className="p-1 ">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                            fill={`${currentCard.priority}`}
                          ></path>
                        </svg>
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className=" hover:cursor-default flex flex-col gap-4 rounded px-2 py-1 shadow-md bg-slate-100">
                        {/* Priority high item */}
                        <div className=" flex gap-2 items-center rounded px-1 hover:bg-emerald-700 hover:text-white">
                          <button
                            onClick={() => {
                              setCurrentCard((currentCard) => {
                                return {
                                  ...currentCard,
                                  priority: Priority.HIGH,
                                };
                              });
                            }}
                            className=" flex items-center justify-center"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                                fill={`${Priority.HIGH}`}
                              ></path>
                            </svg>
                            <span className="ml-1 text-sm">HIGH</span>
                          </button>
                        </div>

                        {/* Priority medium item */}
                        <div className=" flex gap-2 items-center rounded px-1 hover:bg-emerald-700 hover:text-white">
                          <button
                            onClick={() => {
                              setCurrentCard((currentCard) => {
                                return {
                                  ...currentCard,
                                  priority: Priority.MEDIUM,
                                };
                              });
                            }}
                            className=" flex items-center justify-center"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                                fill={`${Priority.MEDIUM}`}
                              ></path>
                            </svg>
                            <span className="ml-1 text-sm">MEDIUM</span>
                          </button>
                        </div>

                        {/* Priority low item */}
                        <div className=" flex gap-2 items-center rounded px-1 hover:bg-emerald-700 hover:text-white">
                          <button
                            onClick={() => {
                              setCurrentCard((currentCard) => {
                                return {
                                  ...currentCard,
                                  priority: Priority.LOW,
                                };
                              });
                            }}
                            className=" flex items-center justify-center"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                                fill={`${Priority.LOW}`}
                              ></path>
                            </svg>
                            <span className="ml-1 text-sm">LOW</span>
                          </button>
                        </div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>

              <div className="mt-[25px] flex justify-end">
                <Dialog.Close asChild className="w-full">
                  <div className=" flex justify-between">
                    <button
                      onClick={() => setShowCardDeleteAlert(true)}
                      className=" bg-iconBg p-2 rounded active:bg-slate-300"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z"
                          fill="#5a5a65"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                    <button
                      onClick={saveHandler}
                      className="bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
                    >
                      Save
                    </button>
                  </div>
                </Dialog.Close>
              </div>
              <Dialog.Close asChild>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                  aria-label="Close"
                >
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Modal to create new  */}
        <Dialog.Root open={showAddTask}>
          {/* <Dialog.Root open={true}> */}
          <Dialog.Portal>
            <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
            <Dialog.Content
              onOpenAutoFocus={(e) => e.preventDefault()}
              className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
            >
              <div className=" flex flex-col gap-4 ">
                <div className=" flex flex-col gap-2 ">
                  <h1 className="resize-none text-base font-semibold text-heading focus ">
                    Title
                  </h1>
                  <input
                    type="text"
                    required
                    autoFocus
                    // className=" p-2 resize-none text-base text-heading focus border-[0px] border-gray-50 rounded"
                    className=" p-2 resize-none text-base text-heading outline-[1px] outline-inputBorder border-[1px] border-inputBorder rounded"
                    onChange={(e) => {
                      setAddTaskContent((task) => {
                        return {
                          ...task,
                          title: e.target.value,
                        };
                      });
                    }}
                  />
                </div>

                <div className=" flex flex-col gap-2 ">
                  <h1 className="resize-none text-base font-semibold text-heading focus ">
                    Description
                  </h1>
                  <textarea
                    rows={4}
                    // className=" p-2 resize-none text-base font-normal text-heading  h-full border-2 border-black rounded"
                    className=" p-2 resize-none text-base text-heading outline-[1px] outline-inputBorder border-[1px] border-inputBorder rounded"
                    onChange={(e) => {
                      setAddTaskContent((task) => {
                        return {
                          ...task,
                          desc: e.target.value,
                        };
                      });
                    }}
                  />
                </div>

                {/* Date section */}
                <div className=" flex flex-col gap-2 ">
                  <h1 className="resize-none text-base font-semibold text-heading focus ">
                    Due Date
                  </h1>

                  <div className="datepicker-container ">
                    <DatePicker
                      className={`m-auto w-24 border-[1px] border-inputBorder rounded text-center`}
                      autoFocus={false}
                      selected={new Date(addTaskContent.date)}
                      onChange={(date) => {
                        if (!date) return;
                        setAddTaskContent((task) => {
                          return {
                            ...task,
                            date: date.getTime(),
                          };
                        });
                      }}
                    />
                  </div>
                </div>

                {/* tag Section */}
                <div className=" flex flex-col gap-2 ">
                  <h1 className="resize-none text-base font-semibold text-heading focus ">
                    Tags
                  </h1>

                  <div className=" flex gap-2 flex-wrap justify-start items-center">
                    {addTaskContent.tags.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setAddTaskContent((currentCard) => {
                            return {
                              ...currentCard,
                              tags: currentCard.tags.filter(
                                (tag) => tag.label !== item.label
                              ),
                            };
                          });
                        }}
                      >
                        <Tag label={item.label} color={item.color} />
                      </button>
                    ))}

                    {/* Section to add more tags */}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild className=" cursor-pointer">
                        <button className="p-1 bg-iconBg rounded active:bg-slate-300">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                              fill="#5a5a65"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className=" hover:cursor-default flex flex-col gap-4 bg-white rounded px-2 py-1 shadow-md">
                          {availableTags.map((tag) => (
                            <button
                              onClick={() => {
                                let found = false;
                                addTaskContent.tags.forEach((item) => {
                                  if (item.label === tag.label) {
                                    found = true;
                                  }
                                });

                                if (found) return;

                                setAddTaskContent((currentCard) => {
                                  return {
                                    ...currentCard,
                                    tags: [tag, ...currentCard.tags],
                                  };
                                });
                              }}
                              key={tag.label}
                              className=""
                            >
                              <Tag label={tag.label} color={tag.color} />
                            </button>
                          ))}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>

                {/* Priority Section */}
                <div className=" flex flex-col gap-2 items-start">
                  <span className=" text-sm font-semibold">Priority:</span>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild className=" cursor-pointer">
                      <button className="p-1 ">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                            fill={`${addTaskContent.priority}`}
                          ></path>
                        </svg>
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className=" hover:cursor-default flex flex-col gap-4 rounded px-2 py-1 shadow-md bg-white">
                        {/* Priority high item */}
                        <div className=" flex gap-2 items-center hover:bg-emerald-700 hover:text-white rounded px-1">
                          <button
                            onClick={() => {
                              setAddTaskContent((currentCard) => {
                                return {
                                  ...currentCard,
                                  priority: Priority.HIGH,
                                };
                              });
                            }}
                            className=" flex items-center justify-center"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                                fill={`${Priority.HIGH}`}
                              ></path>
                            </svg>
                            <span className=" ml-1 text-sm">HIGH</span>
                          </button>
                          {/* <span className=" text-sm">HIGH:</span> */}
                        </div>

                        {/* Priority medium item */}
                        <div className="px-1 hover:bg-emerald-700 hover:text-white rounded flex gap-2 items-center">
                          <button
                            onClick={() => {
                              setAddTaskContent((currentCard) => {
                                return {
                                  ...currentCard,
                                  priority: Priority.MEDIUM,
                                };
                              });
                            }}
                            className=" flex items-center justify-center"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                                fill={`${Priority.MEDIUM}`}
                              ></path>
                            </svg>
                            <span className="ml-1 text-sm">MEDIUM</span>
                          </button>
                        </div>

                        {/* Priority low item */}
                        <div className="px-1 hover:bg-emerald-700 hover:text-white rounded flex gap-2 items-center">
                          <button
                            onClick={() => {
                              setAddTaskContent((currentCard) => {
                                return {
                                  ...currentCard,
                                  priority: Priority.LOW,
                                };
                              });
                            }}
                            className="  flex items-center justify-center"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M7.22303 0.665992C7.32551 0.419604 7.67454 0.419604 7.77702 0.665992L9.41343 4.60039C9.45663 4.70426 9.55432 4.77523 9.66645 4.78422L13.914 5.12475C14.18 5.14607 14.2878 5.47802 14.0852 5.65162L10.849 8.42374C10.7636 8.49692 10.7263 8.61176 10.7524 8.72118L11.7411 12.866C11.803 13.1256 11.5206 13.3308 11.2929 13.1917L7.6564 10.9705C7.5604 10.9119 7.43965 10.9119 7.34365 10.9705L3.70718 13.1917C3.47945 13.3308 3.19708 13.1256 3.25899 12.866L4.24769 8.72118C4.2738 8.61176 4.23648 8.49692 4.15105 8.42374L0.914889 5.65162C0.712228 5.47802 0.820086 5.14607 1.08608 5.12475L5.3336 4.78422C5.44573 4.77523 5.54342 4.70426 5.58662 4.60039L7.22303 0.665992Z"
                                fill={`${Priority.LOW}`}
                              ></path>
                            </svg>
                            <span className=" ml-1 text-sm">LOW</span>
                          </button>
                        </div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
                {/* </div> */}

                {/* <div className="mt-[25px] flex justify-end"> */}
                <Dialog.Close asChild>
                  <button
                    onClick={addTaskHandler}
                    className="w-full bg-green4 text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
                  >
                    Add
                  </button>
                </Dialog.Close>
              </div>
              {/* </div> */}
              <Dialog.Close asChild>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                  aria-label="Close"
                >
                  <Cross2Icon />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Modal to edit project title and description */}
        <Dialog.Root open={showProjectEditDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
            <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
              <Dialog.Title className="text-mauve12 m-0 mb-4 text-[17px] font-medium">
                Edit Project
              </Dialog.Title>
              {/*
                    resize-none text-base font-semibold text-heading focus 
                    p-2 resize-none text-base text-heading outline-[1px] outline-inputBorder border-[1px] border-inputBorder rounded
                          */}
              <fieldset className="flex flex-col items-start gap-2 justify-between mb-6">
                <label
                  // className="text-violet11 text-right text-[15px] "
                  className="resize-none text-base font-semibold text-heading focus"
                  htmlFor="username"
                >
                  Title
                </label>
                <textarea
                  autoFocus
                  onFocus={(e) => {
                    e.target.setSelectionRange(0, e.target.value.length);
                  }}
                  className="p-2 w-full resize-none text-base text-heading outline-[1px] outline-inputBorder border-[1px] border-inputBorder rounded"
                  // className="  text-violet11 shadow-violet7 focus:shadow-violet8 inline-flex p-2 w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                  value={kanbnData.projectTitle}
                  // value={newProject.title}
                  onChange={(e) => {
                    setKanbanData((item) => {
                      return {
                        ...item,
                        projectTitle: e.target.value,
                      };
                    });
                  }}
                />
              </fieldset>
              <fieldset className="flex flex-col items-start gap-2 justify-between">
                <label
                  className="resize-none text-base font-semibold text-heading focus"
                  htmlFor="username"
                >
                  Description
                </label>
                <textarea
                  className="p-2 w-full resize-none text-base text-heading outline-[1px] outline-inputBorder border-[1px] border-inputBorder rounded"
                  value={kanbnData.projectDescription}
                  onFocus={(e) => {
                    e.target.setSelectionRange(0, e.target.value.length);
                  }}
                  onChange={(e) =>
                    setKanbanData((item) => {
                      return {
                        ...item,
                        projectDescription: e.target.value,
                      };
                    })
                  }
                />
              </fieldset>
              <div className="mt-[25px] flex justify-end">
                <Dialog.Close asChild>
                  <button
                    onClick={() => {
                      saveTitleAndDescriptionHandler();
                    }}
                    className="bg-green4 w-full text-green11 hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
                  >
                    Save
                  </button>
                </Dialog.Close>
              </div>
              <Dialog.Close asChild>
                <button
                  onClick={() => {
                    setShowProjectEditDialog(false);
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

        {/* Alert to show before deleting project */}
        <AlertDialog.Root open={showProjectDeleteAlert}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
            <AlertDialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
              <AlertDialog.Title className="text-mauve12 m-0 text-[17px] font-medium">
                Deleting Project: {kanbnData.projectTitle}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-mauve11 mt-4 mb-5 text-[15px] leading-normal">
                This action cannot be undone. This will permanently delete this
                project.
              </AlertDialog.Description>
              <div className="flex justify-end gap-[25px]">
                <AlertDialog.Cancel asChild>
                  <button
                    onClick={() => setShowProjectDeleteAlert(false)}
                    className="text-mauve11 bg-mauve4 hover:bg-mauve5 focus:shadow-mauve7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                  >
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={() => {
                      deleteProjectHandler();
                    }}
                    className="bg-red-200  text-red-900 text-red11 bg-red4 hover:bg-red5 focus:shadow-red7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                  >
                    Yes, delete project
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        {/* Alert to show before deleting task */}
        <AlertDialog.Root open={showCardDeleteAlert}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0" />
            <AlertDialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
              <AlertDialog.Title className="text-mauve12 m-0 text-[17px] font-medium">
                Deleting task: {currentCard.title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-mauve11 mt-4 mb-5 text-[15px] leading-normal">
                This action cannot be undone. This will permanently delete this
                Card.
              </AlertDialog.Description>
              <div className="flex justify-end gap-[25px]">
                <AlertDialog.Cancel asChild>
                  <button
                    onClick={() => setShowCardDeleteAlert(false)}
                    className="text-mauve11 bg-mauve4 hover:bg-mauve5 focus:shadow-mauve7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                  >
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={() => {
                      deleteTaskHandler(currentCard.id);
                    }}
                    className="bg-red-200 text-red-800 text-red11 bg-red4 hover:bg-red5 focus:shadow-red7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none outline-none focus:shadow-[0_0_0_2px]"
                  >
                    Yes, delete card
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        {/* Project name and description */}
        <div className=" mx-auto w-4/5 mb-6 flex md:flex-row flex-col items-start md:justify-between ">
          <div>
            <h1 className=" text-2xl md:text-4xl text-heading font-bold mb-2">
              {kanbnData.projectTitle}
            </h1>
            <p className=" text-xs md:text-sm mb-1 text-para font-normal">
              {kanbnData.projectDescription}
            </p>
            {/* <Members /> */}
          </div>

          {/* buttons */}
          <div className="flex items-center gap-4 justify-start">
            <HorizontalList
              checked={horizontalListSelected}
              setChecked={setHorizontalListSelected}
            />
            {/* button to edit task */}
            <button
              onClick={() => setShowProjectEditDialog(true)}
              className=" bg-iconBg rounded active:bg-slate-300 p-1"
            >
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
                // width="28"
                // height="28"
                viewBox="0 0 15 15"
                fill=" #E1E4E8"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.1464 1.14645C12.3417 0.951184 12.6583 0.951184 12.8535 1.14645L14.8535 3.14645C15.0488 3.34171 15.0488 3.65829 14.8535 3.85355L10.9109 7.79618C10.8349 7.87218 10.7471 7.93543 10.651 7.9835L6.72359 9.94721C6.53109 10.0435 6.29861 10.0057 6.14643 9.85355C5.99425 9.70137 5.95652 9.46889 6.05277 9.27639L8.01648 5.34897C8.06455 5.25283 8.1278 5.16507 8.2038 5.08907L12.1464 1.14645ZM12.5 2.20711L8.91091 5.79618L7.87266 7.87267L8.12731 8.12732L10.2038 7.08907L13.7929 3.5L12.5 2.20711ZM9.99998 2L8.99998 3H4.9C4.47171 3 4.18056 3.00039 3.95552 3.01877C3.73631 3.03668 3.62421 3.06915 3.54601 3.10899C3.35785 3.20487 3.20487 3.35785 3.10899 3.54601C3.06915 3.62421 3.03669 3.73631 3.01878 3.95552C3.00039 4.18056 3 4.47171 3 4.9V11.1C3 11.5283 3.00039 11.8194 3.01878 12.0445C3.03669 12.2637 3.06915 12.3758 3.10899 12.454C3.20487 12.6422 3.35785 12.7951 3.54601 12.891C3.62421 12.9309 3.73631 12.9633 3.95552 12.9812C4.18056 12.9996 4.47171 13 4.9 13H11.1C11.5283 13 11.8194 12.9996 12.0445 12.9812C12.2637 12.9633 12.3758 12.9309 12.454 12.891C12.6422 12.7951 12.7951 12.6422 12.891 12.454C12.9309 12.3758 12.9633 12.2637 12.9812 12.0445C12.9996 11.8194 13 11.5283 13 11.1V6.99998L14 5.99998V11.1V11.1207C14 11.5231 14 11.8553 13.9779 12.1259C13.9549 12.407 13.9057 12.6653 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.6653 13.9057 12.407 13.9549 12.1259 13.9779C11.8553 14 11.5231 14 11.1207 14H11.1H4.9H4.87934C4.47686 14 4.14468 14 3.87409 13.9779C3.59304 13.9549 3.33469 13.9057 3.09202 13.782C2.7157 13.5903 2.40973 13.2843 2.21799 12.908C2.09434 12.6653 2.04506 12.407 2.0221 12.1259C1.99999 11.8553 1.99999 11.5231 2 11.1207V11.1206V11.1V4.9V4.87935V4.87932V4.87931C1.99999 4.47685 1.99999 4.14468 2.0221 3.87409C2.04506 3.59304 2.09434 3.33469 2.21799 3.09202C2.40973 2.71569 2.7157 2.40973 3.09202 2.21799C3.33469 2.09434 3.59304 2.04506 3.87409 2.0221C4.14468 1.99999 4.47685 1.99999 4.87932 2H4.87935H4.9H9.99998Z"
                  fill=" #5A5A65"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
            {/* button to delete task */}
            <button
              onClick={() => setShowProjectDeleteAlert(true)}
              className=" bg-iconBg p-1 rounded active:bg-slate-300"
            >
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
                // width="28"
                // height="28"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z"
                  fill="#5a5a65"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
            {/* button to add new task */}
            <button
              onClick={() => {
                setShowAddTask(true);
              }}
              className=" bg-iconBg rounded active:bg-slate-300 p-1"
            >
              <svg
                // width="32"
                // height="32"
                className="w-6 h-6 md:w-8 md:h-8"
                viewBox="0 0 15 15"
                // fill=" #E1E4E8"
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
        </div>

        {/* Kanban boards */}
        <div className="py-2 md:py-3 bg-background  rounded-md mx-auto w-4/5 ">
          <div
            className={` w-11/12 m-auto flex gap-1 md:gap-0 ${
              horizontalListSelected && "flex-col"
            }`}
          >
            {/* <div className=" rounded-md mx-auto w-4/5 h-[500px] bg-background flex flex-col md:flex-row justify-between"> */}
            <DragDropContext
              onDragEnd={(e) => {
                dragEndHandler(e);
              }}
            >
              {/* card lists */}
              {kanbnData.columnOrder.map((colId) => (
                <div className="flex-1" key={colId}>
                  {/* <Label title="To Do" color={COLORS["TAG5"]} /> */}
                  <div className="mb-3 px-3">
                    <Label
                      label={kanbnData.columns[colId].title}
                      color={kanbnData.columns[colId].color}
                    />
                    {/* <Label label={"To Do"} color={COLORS["TAG5"]} /> */}
                  </div>

                  <ScrollArea.Root
                    className={`w-full rounded overflow-hidden ${
                      !horizontalListSelected && "h-[29rem]"
                    }`}
                  >
                    <ScrollArea.Viewport
                      ref={scrollRef}
                      className="w-full h-full"
                    >
                      <StrictModeDroppable
                        droppableId={colId}
                        direction={
                          horizontalListSelected ? `horizontal` : "vertical"
                        }
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex py-1 ${
                              !horizontalListSelected && "flex-col px-2 py-0"
                            }  ${
                              snapshot.isDraggingOver && "bg-slate-300"
                            } h-full`}
                            // className={` ${
                            //   !horizontalListSelected && "px-2 py-0"
                            // }  py-3 ${
                            //   snapshot.isDraggingOver && "bg-slate-300"
                            // }`}
                          >
                            {kanbnData.columns[colId].taskIds.map(
                              (taskId, idx) => (
                                <Draggable
                                  key={taskId}
                                  draggableId={taskId.toString()}
                                  index={idx}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      ref={provided.innerRef}
                                      onClick={() => {
                                        if (
                                          kanbnData.tasks[taskId] ===
                                          currentCard
                                        ) {
                                          setShowDialog(true);
                                        }
                                        setCurrentCard(kanbnData.tasks[taskId]);
                                      }}
                                      className={`${
                                        snapshot.isDragging && "shadow-lg"
                                      } max-w-[8rem] md:max-w-[22rem]`}
                                    >
                                      <Card
                                        title={kanbnData.tasks[taskId].title} //{item.title}
                                        desc={kanbnData.tasks[taskId].desc} // {item.desc}
                                        date={kanbnData.tasks[taskId].date} //{item.date}
                                        tags={kanbnData.tasks[taskId].tags} // {item.tags}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              )
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </StrictModeDroppable>
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
              ))}
            </DragDropContext>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

interface HListType {
  checked: boolean;
  setChecked: React.Dispatch<React.SetStateAction<boolean>>;
}

function HorizontalList({ checked, setChecked }: HListType) {
  return (
    <form>
      <div className="relative">
        <label
          className=" absolute left-0 -bottom-6 md:-bottom-8 text-heading text-[10px] md:text-[15px] leading-none pr-[15px]"
          htmlFor="airplane-mode"
        >
          Horizontal view
        </label>
        <Switch.Root
          checked={checked}
          onCheckedChange={(e) => {
            setChecked((toggle) => !toggle);
          }}
          className="w-[42px] h-[25px] bg-blackA6 rounded-full relative shadow-[0_2px_10px] shadow-blackA4 focus:shadow-[0_0_0_2px] focus:shadow-black data-[state=checked]:bg-black outline-none cursor-default"
          id="airplane-mode"
          // style={{ "-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)" }}
        >
          <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-blackA4 transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
        </Switch.Root>
      </div>
    </form>
  );
}

export default Kanban;
