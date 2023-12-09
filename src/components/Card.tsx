import React from "react";
import { Tag, Label } from "./Tag";
import { COLORS } from "./Utility";

interface CardType {
  title: string;
  desc?: string;
  date?: number;
  tags: { label: string; color: string }[];
}

const Card: React.FC<CardType> = ({ title, desc, date, tags }) => {
  let dateStr = "";
  if (date) {
    const tempDate = new Date(date);
    dateStr = `${tempDate.getDate()}/${1 + tempDate.getMonth()}`;
  }
  return (
    <div className="m-auto h-full w-full p-2 md:p-4 border-b-2 border-r-[1px] border-r-slate-200 border-b-gray-200 flex flex-col gap-2 bg-white shadow-md hover:cursor-pointer truncate">
      {/* <div className=" p-4 rounded-xl flex flex-col gap-2 bg-white shadow-md hover:cursor-pointer"> */}
      <h1 className=" text-sm md:text-base font-semibold text-heading">
        {title}
      </h1>
      {desc && (
        <p className=" text-xs md:text-sm font-normal text-para w-full truncate">
          {desc}
        </p>
      )}
      {date && <Tag label={`Due ${dateStr}`} color={`${COLORS["TAG2"]}`} />}
      <div className=" md:visible hidden md:flex gap-2 flex-wrap justify-start items-center">
        {tags.map((item) => (
          <Tag key={item.label} label={item.label} color={item.color} />
        ))}
      </div>
    </div>
  );
};

export default Card;
