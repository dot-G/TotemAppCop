import { atom } from 'jotai';

export const inactivityModalAtom = atom({
  isOpen: false,
  countdown: 10,
});