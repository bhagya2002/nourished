import {
  IconLayoutDashboard,
  IconLogin,
  IconMoodHappy,
  IconTarget,
  IconStack,
  IconUser,
  IconFriends,
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Goals',
  },
  {
    id: uniqueId(),
    title: 'Goals (Challenges)',
    icon: IconTarget,
    href: '/goals',
  },
  {
    id: uniqueId(),
    title: 'Tasks',
    icon: IconStack,
    href: '/tasks',
  },
  {
    navlabel: true,
    subheader: 'Wellness',
  },
  {
    id: uniqueId(),
    title: 'Mood Tracker',
    icon: IconMoodHappy,
    href: '/mood',
  },
  {
    navlabel: true,
    subheader: 'Community',
  },
  {
    id: uniqueId(),
    title: 'Friend Circle',
    icon: IconFriends,
    href: '/friend-circle',
  },
  {
    navlabel: true,
    subheader: 'Account',
  },
  {
    id: uniqueId(),
    title: 'Profile',
    icon: IconUser,
    href: '/profile',
  },
  {
    id: uniqueId(),
    title: 'Logout',
    icon: IconLogin,
    href: '/authentication/login',
  },
];

export default Menuitems;
