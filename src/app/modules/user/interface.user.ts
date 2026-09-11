// Re-export shared address type so the user module has its own clean import.
// The real source lives in interface.auth.ts alongside TUser.
export { TSavedAddress } from '../auth/interface.auth';
