import { uniqueId } from "lodash";

interface MenuitemsType {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
}
import {
  IconAward,
  IconBoxMultiple,
  IconPoint,
  IconAlertCircle,
  IconNotes,
  IconCalendar,
  IconMail,
  IconTicket,
  IconEdit,
  IconGitMerge,
  IconCurrencyDollar,
  IconApps,
  IconFileDescription,
  IconFileDots,
  IconFiles,
  IconBan,
  IconStar,
  IconMoodSmile,
  IconBorderAll,
  IconBorderHorizontal,
  IconBorderInner,
  IconBorderVertical,
  IconBorderTop,
  IconUserCircle,
  IconPackage,
  IconMessage2,
  IconBasket,
  IconChartLine,
  IconChartArcs,
  IconChartCandle,
  IconChartArea,
  IconChartDots,
  IconChartDonut3,
  IconChartRadar,
  IconLogin,
  IconUserPlus,
  IconRotate,
  IconBox,
  IconShoppingCart,
  IconAperture,
  IconLayout,
  IconSettings,
  IconHelp,
  IconZoomCode,
  IconBoxAlignBottom,
  IconBoxAlignLeft,
  IconBorderStyle2,
  IconLockAccess,
  IconAppWindow,
} from "@tabler/icons-react";

const Menuitems: MenuitemsType[] = [
  {
    navlabel: true,
    subheader: "Home",
  },
  {
    id: uniqueId(),
    title: "eCommerce",
    icon: IconShoppingCart,
    href: "/dashboards/ecommerce",
  },
  {
    navlabel: true,
    subheader: "Apps",
  },
  {
    id: uniqueId(),
    title: "Ecommerce",
    icon: IconBasket,
    href: "/apps/ecommerce/",
    children: [
      {
        id: uniqueId(),
        title: "Shop",
        icon: IconPoint,
        href: "/apps/ecommerce/shop",
      },
      {
        id: uniqueId(),
        title: "Detail",
        icon: IconPoint,
        href: "/apps/ecommerce/detail/1",
      },
      {
        id: uniqueId(),
        title: "List",
        icon: IconPoint,
        href: "/apps/ecommerce/list",
      },
      {
        id: uniqueId(),
        title: "Checkout",
        icon: IconPoint,
        href: "/apps/ecommerce/checkout",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Users",
    icon: IconUserCircle,
    href: "/apps/user-profile/profile",
    children: [
      {
        id: uniqueId(),
        title: "Profile",
        icon: IconPoint,
        href: "/apps/user-profile/profile",
      },
      {
        id: uniqueId(),
        title: "Admin Users",
        icon: IconPoint,
        href: "/apps/admin/users",
      },
      {
        id: uniqueId(),
        title: "Followers",
        icon: IconPoint,
        href: "/apps/user-profile/followers",
      },
      {
        id: uniqueId(),
        title: "Friends",
        icon: IconPoint,
        href: "/apps/user-profile/friends",
      },
      {
        id: uniqueId(),
        title: "Gallery",
        icon: IconPoint,
        href: "/apps/user-profile/gallery",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Account Setting",
    icon: IconUserCircle,
    href: "/theme-pages/account-settings",
  },
];

export default Menuitems;
