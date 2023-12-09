import React from "react";

interface TagType {
  label: string;
  color: string;
}

export const Tag: React.FC<TagType> = ({ label, color }) => {
  return (
    <div
      style={{ backgroundColor: color, color: "#4d4d4d" }}
      className=" text-xs md:text-sm font-medium py-1 px-3 rounded-lg max-w-fit "
    >
      {label}
    </div>
  );
};

export const Label: React.FC<TagType> = ({ label, color }) => {
  return (
    <div
      style={{ backgroundColor: color, color: "#4d4d4d" }}
      className=" m-auto text-xs md:text-base font-semibold py-1 px-3 rounded-[20px] max-w-fit"
    >
      {label}
    </div>
  );
};
