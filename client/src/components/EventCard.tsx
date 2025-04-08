import { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "earnings":
        return "ri-presentation-line";
      case "dividend":
        return "ri-coins-line";
      case "policy":
        return "ri-government-line";
      case "split":
        return "ri-scissors-cut-line";
      case "ipo":
        return "ri-rocket-2-line";
      default:
        return "ri-calendar-event-line";
    }
  };
  
  const getEventColor = (type: string) => {
    switch (type) {
      case "earnings":
        return "bg-blue-50 text-primary-600";
      case "dividend":
        return "bg-green-50 text-success-500";
      case "split":
        return "bg-purple-50 text-purple-600";
      case "ipo":
        return "bg-red-50 text-danger-500";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };
  
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "earnings":
        return "bg-blue-50 text-primary-600";
      case "dividend":
        return "bg-green-50 text-success-500";
      case "split":
        return "bg-purple-50 text-purple-600";
      case "ipo":
        return "bg-red-50 text-danger-500";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="flex items-start">
      <div className={`w-12 h-12 rounded-lg ${getEventColor(event.type)} flex items-center justify-center mr-3`}>
        <i className={`${getEventIcon(event.type)} text-xl`}></i>
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-sm font-medium">{event.title}</span>
          <span className={`ml-2 text-xs px-2 py-0.5 ${getBadgeColor(event.type)} rounded-full`}>{event.date}</span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
      </div>
    </div>
  );
};

export default EventCard;
