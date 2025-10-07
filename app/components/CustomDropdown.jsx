"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const options = [
  { label: "2 - MARKS", value: 2 },
  { label: "5 - MARKS", value: 5 },
  { label: "10 - MARKS", value: 10 },
];

export default function CustomDropdown({ marks, setMarks }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === marks);

  return (
    <div
      className="relative inline-block w-fit cursor-pointer"
      ref={dropdownRef}
    >
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-fit flex justify-between items-center bg-transparent text-white py-3 px-2 rounded-md transition-all"
      >
        {selectedOption?.label}
        <ChevronDown
          className={`ml-2 transition-transform ${isOpen ? "" : "rotate-180"}`}
          size={18}
        />
      </div>

      {isOpen && (
        <ul className="absolute left-0 bottom-full -mb-2 w-fit bg-[#1e1e1e] rounded-md z-10">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                setMarks(opt.value);
                setIsOpen(false);
              }}
              className={`m-2 p-1 cursor-pointer rounded-md hover:bg-[#333333] text-white transition ${
                opt.value === marks
                  ? "bg-[#333333] text-white"
                  : "text-gray-200"
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
