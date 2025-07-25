
'use client';

import { useCallback, useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

import Button from "../Button"; // Assuming Button component path

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  body?: React.ReactElement;
  footer?: React.ReactElement;
  actionLabel: string;
  disabled?: boolean;
  secondaryAction?: () => void;
  secondaryActionLabel?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  body, 
  actionLabel, 
  footer, 
  disabled,
  secondaryAction,
  secondaryActionLabel
}) => {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (disabled) {
      return;
    }
  
    setShowModal(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match this duration with the CSS transition duration
  }, [onClose, disabled]);

  const handleSubmit = useCallback(() => {
    if (disabled) {
      return;
    }

    onSubmit();
  }, [onSubmit, disabled]);

  const handleSecondaryAction = useCallback(() => {
    if (disabled || !secondaryAction) {
      return;
    }

    secondaryAction();
  }, [secondaryAction, disabled]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="
          justify-center 
          items-center 
          flex 
          overflow-x-hidden 
          overflow-y-auto 
          fixed 
          inset-0 
          z-50 
          outline-none 
          focus:outline-none
          bg-neutral-800/70 {/* Darker, slightly more opaque overlay */}
        "
      >
        <div className="
          relative 
          w-full
          md:w-4/6
          lg:w-3/6
          xl:w-2/5
          my-6
          mx-auto 
          h-full 
          lg:h-auto
          md:h-auto
          "
        >
          {/*content*/}
          <div className={`
            translate
            duration-300
            h-full
            ${showModal ? 'translate-y-0' : 'translate-y-full'}
            ${showModal ? 'opacity-100' : 'opacity-0'}
          `}>
            <div className="
              translate
              h-full
              lg:h-auto
              md:h-auto
              border-0 
              rounded-lg 
              shadow-xl {/* Increased shadow for more depth */}
              relative 
              flex 
              flex-col 
              w-full 
              bg-white 
              outline-none 
              focus:outline-none
              border border-gray-100 {/* Subtle border for definition */}
            "
            >
              {/*header*/}
              <div className="
                flex 
                items-center 
                p-6
                rounded-t
                justify-center
                relative
                border-b-[1px]
                "
              >
                <button
                  className="
                    p-1
                    border-0 
                    hover:opacity-70
                    transition
                    absolute
                    left-9
                    top-1/2 -translate-y-1/2 {/* Vertically centered */}
                    rounded-full {/* For a cleaner hover effect */}
                    hover:bg-gray-100 {/* Subtle background on hover */}
                  "
                  onClick={handleClose}
                  aria-label="Close modal" 
                  
                >
                  <IoMdClose size={22} /> {/* Slightly larger icon */}
                </button>
                <div className="text-lg font-semibold">
                  {title}
                </div>
              </div>
              {/*body - This is where the LoginModal's bodyContent will be rendered */}
              <div className="relative p-6 flex-auto">
                {body} {/* Body content should appear before the main action buttons */}
              </div>
              {/*footer - This is where the LoginModal's footerContent will be rendered */}
              <div className="flex flex-col gap-2 p-6">
                <div 
                  className="
                    flex 
                    flex-row 
                    items-center 
                    gap-4 
                    w-full
                  "
                >
                  {secondaryAction && secondaryActionLabel && (
                    <Button 
                      disabled={disabled} 
                      label={secondaryActionLabel} 
                      onClick={handleSecondaryAction}
                      outline
                    />  
                  )}
                  <Button 
                    disabled={disabled} 
                    label={actionLabel} 
                    onClick={handleSubmit}
                  />
                </div>
                {footer} {/* Footer content (like social login buttons) appears after main action */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;
// 'use client';

// import { useCallback, useEffect, useState } from "react";
// import { IoMdClose } from "react-icons/io";

// import Button from "../Button";

// interface ModalProps {
//   isOpen?: boolean;
//   onClose: () => void;
//   onSubmit: () => void;
//   title?: string;
//   body?: React.ReactElement;
//   footer?: React.ReactElement;
//   actionLabel: string;
//   disabled?: boolean;
//   secondaryAction?: () => void;
//   secondaryActionLabel?: string;
// }

// const Modal: React.FC<ModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   onSubmit, 
//   title, 
//   body, 
//   actionLabel, 
//   footer, 
//   disabled,
//   secondaryAction,
//   secondaryActionLabel
// }) => {
//   const [showModal, setShowModal] = useState(isOpen);

//   useEffect(() => {
//     setShowModal(isOpen);
//   }, [isOpen]);

//   const handleClose = useCallback(() => {
//     if (disabled) {
//       return;
//     }
  
//     setShowModal(false);
//     setTimeout(() => {
//       onClose();
//     }, 300)
//   }, [onClose, disabled]);

//   const handleSubmit = useCallback(() => {
//     if (disabled) {
//       return;
//     }

//     onSubmit();
//   }, [onSubmit, disabled]);

//   const handleSecondaryAction = useCallback(() => {
//     if (disabled || !secondaryAction) {
//       return;
//     }

//     secondaryAction();
//   }, [secondaryAction, disabled]);

//   if (!isOpen) {
//     return null;
//   }

//   return (
//     <>
//       <div
//         className="
//           justify-center 
//           items-center 
//           flex 
//           overflow-x-hidden 
//           overflow-y-auto 
//           fixed 
//           inset-0 
//           z-50 
//           outline-none 
//           focus:outline-none
//           bg-neutral-800/70
//         "
//       >
//         <div className="
//           relative 
//           w-full
//           md:w-4/6
//           lg:w-3/6
//           xl:w-2/5
//           my-6
//           mx-auto 
//           h-full 
//           lg:h-auto
//           md:h-auto
//           "
//         >
//           {/*content*/}
//           <div className={`
//             translate
//             duration-300
//             h-full
//             ${showModal ? 'translate-y-0' : 'translate-y-full'}
//             ${showModal ? 'opacity-100' : 'opacity-0'}
//           `}>
//             <div className="
//               translate
//               h-full
//               lg:h-auto
//               md:h-auto
//               border-0 
//               rounded-lg 
//               shadow-lg 
//               relative 
//               flex 
//               flex-col 
//               w-full 
//               bg-white 
//               outline-none 
//               focus:outline-none
//             "
//             >
//               {/*header*/}
//               <div className="
//                 flex 
//                 items-center 
//                 p-6
//                 rounded-t
//                 justify-center
//                 relative
//                 border-b-[1px]
//                 "
//               >
//                 <button
//                   className="
//                     p-1
//                     border-0 
//                     hover:opacity-70
//                     transition
//                     absolute
//                     left-9
//                   "
//                   onClick={handleClose}
//                 >
//                   <IoMdClose size={18} />
//                 </button>
//                 <div className="text-lg font-semibold">
//                   {title}
//                 </div>
//               </div>
//               {/*body*/}
//               <div className="relative p-6 flex-auto">
//                 {body}
//               </div>
//               {/*footer*/}
//               <div className="flex flex-col gap-2 p-6">
//                 <div 
//                   className="
//                     flex 
//                     flex-row 
//                     items-center 
//                     gap-4 
//                     w-full
//                   "
//                 >
//                   {secondaryAction && secondaryActionLabel && (
//                     <Button 
//                       disabled={disabled} 
//                       label={secondaryActionLabel} 
//                       onClick={handleSecondaryAction}
//                       outline
//                     />  
//                   )}
//                   <Button 
//                     disabled={disabled} 
//                     label={actionLabel} 
//                     onClick={handleSubmit}
//                   />
//                 </div>
//                 {footer}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default Modal;
