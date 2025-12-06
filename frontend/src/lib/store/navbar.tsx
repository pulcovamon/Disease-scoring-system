import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  ReactNode,
} from "react";

type NavbarState = {
  collapsed: boolean;
  openMenus: Record<string, boolean>;
};

type NavbarContextValue = NavbarState & {
  toggleCollapse: () => void;
  toggleMenu: (menu: string) => void;
  setCollapsed: (collapsed: boolean) => void;
};

type Action =
  | { type: "toggleCollapse" }
  | { type: "toggleMenu"; menu: string }
  | { type: "setCollapsed"; collapsed: boolean };

const defaultState: NavbarState = {
  collapsed: false,
  openMenus: {},
};

function loadPersisted(): NavbarState {
  if (typeof localStorage === "undefined") return defaultState;

  try {
    const collapsedStored = localStorage.getItem("navbarCollapsed");
    const openMenusStored = localStorage.getItem("navbarOpenMenus");
    const collapsed = collapsedStored === "true";
    const openMenus = openMenusStored ? (JSON.parse(openMenusStored) as Record<string, boolean>) : {};

    return {
      collapsed,
      openMenus: collapsed ? {} : openMenus,
    };
  } catch (error) {
    console.warn("Failed to load navbar state from storage", error);
    return defaultState;
  }
}

function reducer(state: NavbarState, action: Action): NavbarState {
  switch (action.type) {
    case "toggleCollapse": {
      const collapsed = !state.collapsed;
      return {
        collapsed,
        openMenus: collapsed ? {} : state.openMenus,
      };
    }
    case "setCollapsed": {
      const collapsed = action.collapsed;
      return {
        collapsed,
        openMenus: collapsed ? {} : state.openMenus,
      };
    }
    case "toggleMenu": {
      if (state.collapsed) {
        return {
          collapsed: false,
          openMenus: { [action.menu]: true },
        };
      }
      const next = { ...state.openMenus, [action.menu]: !state.openMenus[action.menu] };
      return {
        ...state,
        openMenus: next,
      };
    }
    default:
      return state;
  }
}

const NavbarContext = createContext<NavbarContextValue | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState, loadPersisted);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem("navbarCollapsed", state.collapsed.toString());
      localStorage.setItem("navbarOpenMenus", JSON.stringify(state.openMenus));
    } catch (error) {
      console.warn("Failed to persist navbar state", error);
    }
  }, [state.collapsed, state.openMenus]);

  const value = useMemo<NavbarContextValue>(
    () => ({
      ...state,
      toggleCollapse: () => dispatch({ type: "toggleCollapse" }),
      toggleMenu: (menu: string) => dispatch({ type: "toggleMenu", menu }),
      setCollapsed: (collapsed: boolean) => dispatch({ type: "setCollapsed", collapsed }),
    }),
    [state]
  );

  return <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>;
}

export function useNavbarStore(): NavbarContextValue {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbarStore must be used within a NavbarProvider");
  }
  return context;
}
