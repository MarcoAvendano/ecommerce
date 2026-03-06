"use client";
import { persistor, store } from "./store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ReactQueryProvider } from "@/lib/react-query/provider";

export function Providers({ children }: { children: any }) {
  return (
    <ReactQueryProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      </Provider>
    </ReactQueryProvider>
  );
}
