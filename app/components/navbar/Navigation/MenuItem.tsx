/**
 * Dummy MenuItem Component.
 * Embedded directly for self-containment within NavBar.
 */
export const MenuItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <div
    onClick={onClick}
    className="px-2 py-2 hover:bg-neutral-100 transition font-semibold cursor-pointer"
  >
    {label}
  </div>
);
