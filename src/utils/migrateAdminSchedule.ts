import { addAdminScheduleEntry, AdminScheduleEntry } from '../services/api/adminScheduleService';

const ADMIN_SCHEDULE_KEY = 'adminScheduleEntries'; // This was the key used in localStorage

export const migrateAdminScheduleFromLocalStorage = async () => {
  console.log('Attempting to migrate admin schedule entries from localStorage...');
  const storedData = localStorage.getItem(ADMIN_SCHEDULE_KEY);

  if (!storedData) {
    console.log('No admin schedule entries found in localStorage. Migration not needed.');
    return;
  }

  try {
    const entries: AdminScheduleEntry[] = JSON.parse(storedData);

    if (!Array.isArray(entries) || entries.length === 0) {
      console.log('No valid admin schedule entries found in localStorage. Migration not needed.');
      localStorage.removeItem(ADMIN_SCHEDULE_KEY);
      return;
    }

    console.log(`Found ${entries.length} entries in localStorage. Migrating...`);

    for (const entry of entries) {
      // Remove the 'id' property if it's an empty string or null, as the backend will generate one if not provided
      const { id, ...entryWithoutId } = entry;
      try {
        await addAdminScheduleEntry(entryWithoutId);
        console.log(`Migrated entry: ${entry.id || '[no-id]'} - ${entry.day} ${entry.startTime}`);
      } catch (error) {
        console.error(`Failed to migrate entry ${entry.id || '[no-id]'}:`, error);
      }
    }

    localStorage.removeItem(ADMIN_SCHEDULE_KEY);
    console.log('Admin schedule entries migration complete and localStorage cleared.');
  } catch (error) {
    console.error('Error parsing admin schedule entries from localStorage:', error);
  }
};
