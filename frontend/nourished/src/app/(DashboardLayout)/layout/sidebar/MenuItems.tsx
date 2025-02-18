import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconLogin,
  IconMoodHappy,
  IconTypography,
  IconUserPlus,
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
    subheader: 'For Future',
  },
  {
    id: uniqueId(),
    title: 'Future Pages',
    icon: IconAperture,
    href: '/sample-page',
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
