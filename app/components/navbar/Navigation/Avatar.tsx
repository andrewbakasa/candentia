/**
 * Dummy Avatar Component.
 * Embedded directly for self-containment within NavBar.
 */
export const Avatar = ({ src, classList }: { src?: string | null; classList?: string }) => (
  <img
    src={src || 'https://placehold.co/32x32/cccccc/ffffff?text=User'} // Default placeholder if no src
    className={`rounded-full h-8 w-8 object-cover ${classList}`}
    alt="User Avatar"
    onError={(e) => { e.currentTarget.src = 'https://placehold.co/32x32/cccccc/ffffff?text=User'; }} // Fallback on error
  />
);
