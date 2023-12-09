import React from "react";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Nav = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("Context is not defined");
  }

  const [AuthDetails, setAuthDetails] = context;
  const navigate = useNavigate();

  //-------------------------------------------------------functions--------------------------------------------

  const signoutHandler = () => {
    sessionStorage.removeItem("REFRESH_TOKEN");
    setAuthDetails({
      USERNAME: "",
      TOKEN: "",
      expiresIn: 0,
    });

    navigate("/auth");
  };
  return (
    <div className=" flex py-2 md:px-20 px-14 justify-end">
      <div className="flex flex-col gap-1 justify-center">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            {/* <button className=" bg-red-300">button</button> */}
            <Avatar.Root className="bg-blackA1 inline-flex h-[30px] md:h-[45px] w-[30px] md:w-[45px] select-none items-center justify-center overflow-hidden rounded-full align-middle">
              <Avatar.Image
                className="h-full w-full rounded-[inherit] object-cover"
                src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
                alt="Colm Tuite"
              />
              <Avatar.Fallback
                className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
                delayMs={600}
              >
                CT
              </Avatar.Fallback>
            </Avatar.Root>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className=" bg-white rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
              {/* <DropdownMenu.Content className=" min-w-[220px] bg-white rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"> */}
              <DropdownMenu.Item className=" text-center text-para text-sm hover:outline-none">
                {AuthDetails.USERNAME}
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-[1px] bg-violet6 m-[5px]" />
              <DropdownMenu.Item
                onClick={() => {}}
                className="group text-[13px] leading-none text-para rounded-[3px] flex items-center h-[25px] px-[5px] relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
              >
                Change Profile Picture
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={signoutHandler}
                className="group text-[13px] leading-none text-para rounded-[3px] flex items-center h-[25px] px-[5px] relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
              >
                Sign Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <div className=" text-para text-sm text-center">
          {AuthDetails.USERNAME}
        </div>
      </div>
    </div>
  );
};

export default Nav;
