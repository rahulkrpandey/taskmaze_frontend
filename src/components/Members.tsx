import React from "react";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const Members = () => {
  const members = [
    "raj",
    "rajan",
    "shivam",
    "rani",
    "rahul",
    "saurabh",
    "raj",
    "rajan",
    "shivam",
    "rani",
    "rahul",
    "saurabh",
    "raj",
    "rajan",
    "shivam",
    "rani",
    "rahul",
    "saurabh",
    "raj",
    "rajan",
    "shivam",
    "rani",
    "rahul",
    "saurabh",
  ];
  return (
    <div>
      <h1 className=" text-sm font-semibold">Team</h1>
      <div className=" flex gap-2 items-center">
        {members.slice(0, 3).map((item, idx) => (
          <Avatar.Root key={idx} className="bg-blackA1 inline-flex h-[25px] w-[25px] select-none items-center justify-center overflow-hidden rounded-full align-middle">
            <Avatar.Image
              className="h-full w-full rounded-[inherit] object-cover"
              src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
              alt="Colm Tuite"
            />
            <Avatar.Fallback
              className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
              delayMs={600}
            >
              {item}
            </Avatar.Fallback>
          </Avatar.Root>
        ))}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className=" bg-iconBg p-1 rounded">
              <svg
                width="16"
                height="16"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                  fill="#5a5a65"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className=" -translate-y-7 bg-white rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade">
              <div className=" flex gap-4 justify-center items-start flex-wrap p-2 max-w-xs">
                {members.map((item, idx) => (
                  <div
                    key={idx}
                    className=" flex flex-col gap-1 item-center justify-center "
                  >
                    <Avatar.Root className="m-auto bg-blackA1 inline-flex h-[25px] w-[25px] select-none items-center justify-center overflow-hidden rounded-full align-middle">
                      <Avatar.Image
                        className="h-full w-full rounded-[inherit] object-cover"
                        src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
                        alt="Colm Tuite"
                      />
                      <Avatar.Fallback
                        className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
                        delayMs={600}
                      >
                        {item}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <span className=" text-sm text-para text-center">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
};

export default Members;
