/**
 * Global session tracker to allow exit hooks
 * to access the current user ID.
 */
let currentUserId = null;
export const session = {
    getUserId: () => currentUserId,
    setUserId: (id) => {
        currentUserId = id;
    }
};
