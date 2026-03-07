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
  IconUsersGroup,
  IconCategory,
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
    subheader: "Operations",
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
    ],
  },
  {
    title: "Sales",
    icon: IconShoppingCart,
    // chip: "2",
    chipColor: "secondary",
    href: "/apps/sales",
  },
  {
    id: uniqueId(),
    title: "Products",
    icon: IconPackage,
    // chip: "2",
    chipColor: "secondary",
    href: "/apps/contacts",
  },
  {
    id: uniqueId(),
    title: "Categories",
    icon: IconCategory,
    // chip: "2",
    chipColor: "secondary",
    href: "/apps/contacts",
  },
  {
    id: uniqueId(),
    title: "Clients",
    icon: IconPackage,
    // chip: "2",
    chipColor: "secondary",
    href: "/apps/contacts",
  },
  {
    id: uniqueId(),
    title: "Suppliers",
    icon: IconPackage,
    // chip: "2",
    chipColor: "secondary",
    href: "/apps/contacts",
  },
  {
    id: uniqueId(),
    title: "Usuarios del sistema",
    icon: IconUsersGroup,
    href: "/admin/users",
  },
  {
    id: uniqueId(),
    title: "Account Setting",
    icon: IconSettings,
    href: "/theme-pages/account-settings",
  },
];

export default Menuitems;
