import { useLocation } from "wouter";

const Sidebar = () => {
  const [location, setLocation] = useLocation();

  const navItems = [
    { name: "Chat", icon: "ri-message-3-line", route: "/" },
    { name: "Markets", icon: "ri-line-chart-line", route: "/markets" },
    { name: "Portfolio", icon: "ri-wallet-3-line", route: "/portfolio" },
    { name: "History", icon: "ri-time-line", route: "/history" },
    { name: "Settings", icon: "ri-settings-4-line", route: "/settings" },
  ];

  return (
    <aside className="w-full md:w-20 bg-white border-r border-slate-200 p-2 flex flex-row md:flex-col items-center justify-between md:justify-start">
      <div className="flex md:flex-col items-center space-x-2 md:space-x-0 md:space-y-6 md:pt-4">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setLocation(item.route)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg ${
              location === item.route
                ? "text-primary-600 bg-primary-50"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <i className={`${item.icon} text-lg`}></i>
            <span className="text-xs mt-1">{item.name}</span>
          </button>
        ))}
      </div>
      <div className="md:mt-auto md:mb-8 hidden md:block">
        <button className="flex flex-col items-center justify-center w-16 h-14 text-slate-500 hover:bg-slate-50 rounded-lg">
          <i className="ri-question-line text-lg"></i>
          <span className="text-xs mt-1">Help</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
