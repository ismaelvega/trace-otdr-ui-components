import { createContext, useContext, useMemo, useState, type ReactElement, type ReactNode } from "react";

interface EventSelectionState {
  selectedIndex: number | null;
  select: (index: number | null) => void;
}

const EventSelectionContext = createContext<EventSelectionState | null>(null);

export function EventSelectionProvider({ children }: { children: ReactNode }): ReactElement {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const value = useMemo<EventSelectionState>(
    () => ({
      selectedIndex,
      select: setSelectedIndex,
    }),
    [selectedIndex],
  );

  return <EventSelectionContext.Provider value={value}>{children}</EventSelectionContext.Provider>;
}

export function useEventSelection(): EventSelectionState {
  const context = useContext(EventSelectionContext);
  if (!context) {
    return {
      selectedIndex: null,
      select: () => undefined,
    };
  }

  return context;
}
