import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import SideNavbar from "../components/SideNavbar";
import Header from "../components/Header";

const AppLayout = () => {
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return (
    <div className="bg-[#eff4f8] min-h-screen">
      {/* HEADER */}
      <div className="fixed top-0 left-0 w-full h-16 z-50 bg-white shadow">
        <Header openSidebar={() => setIsSidebarOpen(true)} />
      </div>

      {/* MAIN CONTENT */}
      <main className="pt-16 pb-20 px-4">
        <Outlet />
      </main>

      {/* BOTTOM NAVBAR */}
      <div className="fixed bottom-0 left-0 w-full z-50  shadow-lg">
        <SideNavbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>
    </div>
  );
};

export default AppLayout;
