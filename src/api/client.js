// API client placeholder
// This is a mock client for the TradingFM Journal app

export const api = {
  entities: {
    User: {
      list: async () => {
        console.log('Fetching users');
        return [];
      },
      create: async (data) => {
        console.log('Creating user:', data);
        return { id: Date.now(), ...data };
      },
      update: async (id, data) => {
        console.log('Updating user:', id, data);
        return { id, ...data };
      },
      delete: async (id) => {
        console.log('Deleting user:', id);
        return { success: true };
      }
    },
    Invite: {
      list: async () => {
        console.log('Fetching invites');
        return [];
      },
      create: async (data) => {
        console.log('Creating invite:', data);
        return { id: Date.now(), ...data };
      },
      update: async (id, data) => {
        console.log('Updating invite:', id, data);
        return { id, ...data };
      },
      delete: async (id) => {
        console.log('Deleting invite:', id);
        return { success: true };
      }
    }
  }
};
