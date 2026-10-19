import { Outlet } from "react-router-dom";
import { AppProviders } from "../../components/ui";
import { AppStateProvider } from "../../state/AppStateContext";

export default function RootProviders() {
  return (
    <AppStateProvider>
      <AppProviders>
        <Outlet />
      </AppProviders>
    </AppStateProvider>
  );
}
