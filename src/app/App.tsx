import { AppRouter } from "./router";
import { SessionProvider } from "./providers/session-provider";

export function App() {
  return (
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  );
}
