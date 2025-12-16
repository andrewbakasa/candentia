// Define this in a separate file, or keep it above the UserMenu component
export const MenuItem: React.FC<{ label: string; onClick: () => void; icon?: React.ReactNode; extraClasses?: string }> = ({ label, onClick, icon, extraClasses = '' }) => (
    <div
        onClick={onClick}
        className={`
            px-3 py-2 flex items-center
            text-gray-700 hover:bg-neutral-100 transition 
            font-medium cursor-pointer rounded-lg
            ${extraClasses}
        `}
    >
        {icon}
        {label}
    </div>
);
// /**
//  * Dummy MenuItem Component.
//  * Embedded directly for self-containment within NavBar.
//  */
// export const MenuItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
//   <div
//     onClick={onClick}
//     className="px-2 py-2 hover:bg-neutral-100 transition font-semibold cursor-pointer"
//   >
//     {label}
//   </div>
// );
