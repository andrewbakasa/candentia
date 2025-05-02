
// import React, { useState } from 'react';
// //import Calendar from 'react-calendar';
// //import './CalendarWithPopup.css'; // Optional for custom styles
// import 'react-calendar/dist/Calendar.css';
// //import Calendar from "@/app/components/inputs/Calendar";
// import Calendar from 'react-calendar';
// interface CalendarProps {
//   onChange: (date: Date) => void;
//   defaultValue?: Date | null; // Optional default value
// }

// const CalendarWithPopup: React.FC<CalendarProps> = ({ onChange, defaultValue }) => {
//   const [showPopup, setShowPopup] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(defaultValue || new Date());

// //   const handleDateChange = (date: Date) => {
// //     setSelectedDate(date);
// //     onChange(date); // Call the provided onChange handler
// //   };
//   const handleDateChange = (value: any, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
//     const date = value as Date;
//     setSelectedDate(date);
//     onChange(date);
//     setShowPopup(false)
//   };

//   const handlePopupToggle = () => {
//     setShowPopup(!showPopup);
//   };

//   return (
//     <div className="calendar-container max-w-[90vw]">
//      {showPopup && ( <Calendar
//         onChange={handleDateChange}
//         value={selectedDate}
//         showWeekNumbers
//       />)}
//        {/* <Calendar  onChange={onChange} className="max-w-[90vw]" showWeekNumbers value={dtVal} />  */}
//         <div className="popup">
//           {/* Your popup content here */}
//           <p>Selected Date: { "TEST"
//         //   selectedDate?.toLocaleDateString()
//           }</p>
//           {/* Add buttons, forms, or other elements as needed */}
//           <div onClick={handlePopupToggle}>{showPopup?"Close":"Open"}</div>
//         </div>
     
//     </div>
//   );
// };

// export default CalendarWithPopup;

