/**
 * Dummy MenuItem Component.
 * Embedded directly for self-containment within NavBar.
 */
export const MenuItem: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <div
    onClick={onClick}
    className="px-4 py-3 hover:bg-neutral-100 transition font-semibold cursor-pointer"
  >
    {label}
  </div>
);
