import { Route, Routes } from "react-router-dom";

import { AppShell } from "@mantine/core";
import CreateRecipePage from "./routes/ModifyRecipe/CreateRecipePage";
import Home from "src/routes/Home/Home";
import NavigationHeader from "./common/components/Navigation/Header/NavigationHeader";
import NavigationSidebar from "./common/components/Navigation/Sidebar/NavigationSidebar";
import React from "react";
import RecipePage from "./routes/Recipe/RecipePage";
import { useDisclosure } from "@mantine/hooks";

function App() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      header={{ height: { base: 60, md: 65, lg: 65 } }}
      navbar={{
        width: { base: 200, md: 300, lg: 400 },
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <NavigationHeader
          {...{ mobileOpened, desktopOpened, toggleMobile, toggleDesktop }}
        />
      </AppShell.Header>
      <AppShell.Navbar>
        <NavigationSidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new-recipe" element={<CreateRecipePage />} />
          <Route path="/recipes/:recipeId" element={<RecipePage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
