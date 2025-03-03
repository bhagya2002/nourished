import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconLogin,
  IconMoodHappy,
  IconTypography,
  IconUserPlus,
  IconTarget,
  IconStack,
  IconUser,
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
    title: 'Goals',
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
    id: uniqueId(),
    title: 'Typos',
    icon: IconTypography,
    href: '/utilities/typography',
  },
  {
    id: uniqueId(),
    title: 'Shadow',
    icon: IconCopy,
    href: '/utilities/shadow',
  },
  {
    navlabel: true,
    subheader: 'Community',
  },
  {
    id: uniqueId(),
    title: 'Friend Circle',
    icon: IconAperture,
    href: '/friend-circle',
  },
  {
    navlabel: true,
    subheader: 'User',
  },
  {
    id: uniqueId(),
    title: 'Account',
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
