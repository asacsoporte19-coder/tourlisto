"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

export default function DateRangePicker({ startDate, endDate, onDateChange }) {
    const [dateRange, setDateRange] = useState([startDate, endDate]);
    const [start, end] = dateRange;

    const handleChange = (update) => {
        setDateRange(update);
        if (update[0] && update[1]) {
            onDateChange(update[0], update[1]);
        }
    };

    return (
        <div className="relative">
            <DatePicker
                selectsRange={true}
                startDate={start}
                endDate={end}
                onChange={handleChange}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select trip dates"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                calendarClassName="custom-datepicker"
                wrapperClassName="w-full"
            />
            <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={18} />

            <style jsx global>{`
        .custom-datepicker {
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          backdrop-filter: blur(20px);
          color: white;
          font-family: inherit;
        }
        
        .react-datepicker__header {
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem 1rem 0 0;
        }
        
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: white;
        }
        
        .react-datepicker__day {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .react-datepicker__day:hover {
          background: rgba(59, 130, 246, 0.3);
          color: white;
        }
        
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background: rgb(59, 130, 246);
          color: white;
        }
        
        .react-datepicker__day--keyboard-selected {
          background: rgba(59, 130, 246, 0.5);
        }
        
        .react-datepicker__day--disabled {
          color: rgba(255, 255, 255, 0.2);
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: white;
        }
        
        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
        </div>
    );
}
