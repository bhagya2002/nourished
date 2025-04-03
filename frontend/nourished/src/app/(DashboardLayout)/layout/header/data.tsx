import img1 from "src/assets/images/profile/user-1.jpg";
import img2 from "src/assets/images/profile/user-2.jpg";
import img3 from "src/assets/images/profile/user-3.jpg";
import img4 from "src/assets/images/profile/user-4.jpg";

import icon1 from "src/assets/images/svgs/icon-account.svg";
import icon2 from "src/assets/images/svgs/icon-inbox.svg";
import icon3 from "src/assets/images/svgs/icon-tasks.svg";

import ddIcon4 from "src/assets/images/svgs/icon-dd-date.svg";
import ddIcon5 from "src/assets/images/svgs/icon-dd-mobile.svg";
import ddIcon7 from "src/assets/images/svgs/icon-dd-message-box.svg";
import ddIcon8 from "src/assets/images/svgs/icon-dd-application.svg";

//
// Notifications dropdown
//
const notifications = [
  {
    avatar: img1,
    title: "Roman Joined the Team!",
    subtitle: "Congratulate him",
  },
  {
    avatar: img2,
    title: "New message received",
    subtitle: "Salma sent you new message",
  },
  {
    avatar: img3,
    title: "New Payment received",
    subtitle: "Check your earnings",
  },
  {
    avatar: img4,
    title: "Jolly completed tasks",
    subtitle: "Assign her new tasks",
  },
  {
    avatar: img1,
    title: "Roman Joined the Team!",
    subtitle: "Congratulate him",
  },
  {
    avatar: img2,
    title: "New message received",
    subtitle: "Salma sent you new message",
  },
  {
    avatar: img3,
    title: "New Payment received",
    subtitle: "Check your earnings",
  },
  {
    avatar: img4,
    title: "Jolly completed tasks",
    subtitle: "Assign her new tasks",
  },
];

//
// Profile dropdown
//
const profile = [
  {
    href: "/user-profile",
    title: "My Profile",
    subtitle: "Account Settings",
    icon: icon1,
  },
  {
    href: "/apps/email",
    title: "My Inbox",
    subtitle: "Messages & Emails",
    icon: icon2,
  },
  {
    href: "/apps/notes",
    title: "My Tasks",
    subtitle: "To-do and Daily Tasks",
    icon: icon3,
  },
];

// apps dropdown

const appsLink = [
  {
    href: "/apps/calendar",
    title: "Calendar App",
    subtext: "Messages & Emails",
    avatar: ddIcon4,
  },
  {
    href: "/apps/contacts",
    title: "Contact Application",
    subtext: "Account settings",
    avatar: ddIcon5,
  },
  {
    href: "/apps/email",
    title: "Email App",
    subtext: "To-do and Daily tasks",
    avatar: ddIcon7,
  },
  {
    href: "/",
    title: "Kanban Application",
    subtext: "To-do and Daily tasks",
    avatar: ddIcon8,
  },
];

const pageLinks = [
  {
    href: "/authentication/login",
    title: "Authentication Design",
  },
  {
    href: "/authentication/register",
    title: "Register Now",
  },
  {
    href: "/404",
    title: "404 Error Page",
  },
  {
    href: "/apps/notes",
    title: "Notes App",
  },
  {
    href: "/user-profile",
    title: "User Application",
  },
];

export { notifications, profile, pageLinks, appsLink };
