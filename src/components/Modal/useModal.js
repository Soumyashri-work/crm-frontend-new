/**
 * useModal — Simple hook for managing modal open/close state
 * 
 * Example:
 *   const { isOpen, open, close } = useModal();
 *   <button onClick={open}>Open Modal</button>
 *   <Modal isOpen={isOpen} onClose={close}>...</Modal>
 */

import { useState } from 'react';

export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}