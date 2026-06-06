import React, { useState, useEffect } from "react"
import { CalendarIcon, FileTextIcon, HeartIcon } from "@radix-ui/react-icons"
import { BellIcon, Plus, Layers, IndianRupee } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { AnimatedList } from "@/components/ui/animated-list"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { useNavigate } from "react-router-dom"
import { ReminderModal, NotificationModal } from "./FeatureModals"

const DynamicNotification = ({ name, description, icon, color, time }) => {
  return (
    <figure className={cn("relative mx-auto min-h-fit w-full max-w-[400px] overflow-hidden rounded-2xl p-4", "transition-all duration-200 ease-in-out hover:scale-[103%]", "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]", "transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]")}>
      <div className="flex flex-row items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl" style={{ backgroundColor: color }}>
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="text-sm sm:text-base">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">{description}</p>
        </div>
      </div>
    </figure>
  )
}

export function BentoDemo() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const fetchData = async () => {
    try {
      const [remRes, notRes] = await Promise.all([
        fetch('http://localhost:5000/api/features/reminders', { headers: { 'Authorization': `Bearer ${userInfo.token}` } }),
        fetch('http://localhost:5000/api/features/notifications', { headers: { 'Authorization': `Bearer ${userInfo.token}` } })
      ]);
      if (remRes.ok) setReminders(await remRes.json());
      if (notRes.ok) setNotifications(await notRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const defaultNotifications = [
    { name: "System Status", description: "All systems online.", time: "Just now", icon: "✅", color: "#22C55E" }
  ];
  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications;

  // Calendar dates with reminders
  const reminderDates = reminders.map(r => new Date(r.date));

  const features = [
    {
      Icon: BellIcon,
      name: "Notifications",
      description: "Push & manage live system notifications.",
      href: "/notifications",
      cta: "Manage Notifications",
      className: "col-span-3 lg:col-span-2 cursor-pointer transition-transform hover:shadow-xl",
      background: (
        <div className="absolute top-44 right-2 h-[350px] w-full scale-90 border-none [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-95 group-hover:-translate-y-4">
          <AnimatedList>
            {displayNotifications.map((item, idx) => (
              <DynamicNotification {...item} key={idx} />
            ))}
          </AnimatedList>
        </div>
      ),
    },
    {
      Icon: CalendarIcon,
      name: "Calendar",
      description: "Click to view database-synced reminders.",
      className: "col-span-3 lg:col-span-1 cursor-pointer transition-transform hover:shadow-xl",
      href: "/calendar",
      cta: "View Calendar",
      background: (
        <Calendar
          mode="multiple"
          selected={reminderDates}
          className="absolute top-44 right-0 lg:-right-4 origin-top scale-90 rounded-xl border bg-white dark:bg-slate-900 shadow-sm [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-95 group-hover:-translate-y-4"
        />
      ),
    },
    {
      Icon: Layers,
      name: "Project Manager",
      description: "Oversee active projects, assign division heads, and track group leaders.",
      className: "col-span-3 lg:col-span-1 cursor-pointer transition-transform hover:shadow-xl",
      href: "/projects",
      cta: "Manage Projects",
      background: (
        <div className="absolute top-44 right-4 text-[120px] opacity-10 transform transition-all duration-300 group-hover:scale-110 group-hover:opacity-20 text-pink-600">
          <Layers />
        </div>
      ),
    },
    {
      Icon: IndianRupee,
      name: "Budget Manager",
      description: "Track project expenses, financial allocations, and manage budgets dynamically.",
      className: "col-span-3 lg:col-span-2 cursor-pointer transition-transform hover:shadow-xl",
      href: "/budgets",
      cta: "Manage Budgets",
      background: (
        <div className="absolute top-36 right-8 text-[160px] opacity-10 transform transition-all duration-300 group-hover:-rotate-12 group-hover:opacity-20 text-emerald-600">
          <IndianRupee />
        </div>
      ),
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto opacity-95">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Interactive System Tools</h2>
      <BentoGrid className="auto-rows-[22rem]">
        {features.map((feature, idx) => (
          <BentoCard 
            key={idx} 
            onClick={() => navigate(feature.href)} 
            {...feature} 
          />
        ))}
      </BentoGrid>
    </div>
  )
}
