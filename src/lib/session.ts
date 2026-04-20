/**
 * Global session tracker to allow exit hooks 
 * to access the current user ID.
 */
let currentUserId: string | null = null;

export const session = {
  getUserId: () => currentUserId,
  setUserId: (id: string | null) => {
    currentUserId = id;
  }
};
