import PropTypes from "prop-types";

import { ListSubheader, styled, Theme, useTheme } from "@mui/material";

type NavGroup = {
  navlabel?: boolean;
  subheader?: string;
};

interface ItemType {
  item: NavGroup;
}

const NavGroup = ({ item }: ItemType) => {
  const theme = useTheme();

  const ListSubheaderStyle = styled((props: Theme | any) => (
    <ListSubheader disableSticky {...props} />
  ))(({ theme }) => ({
    ...theme.typography.overline,
    fontWeight: "600",
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(0),
    color: theme.palette.text.secondary,
    lineHeight: "16px",
    padding: "5px 10px 5px 0",
    position: "relative",
    letterSpacing: "0.5px",
    fontSize: "11px",
    textTransform: "uppercase",
    "&::before": {
      content: '""',
      width: "5px",
      height: "5px",
      backgroundColor: theme.palette.primary.main,
      borderRadius: "50%",
      position: "relative",
      display: "inline-block",
      marginRight: "10px",
      marginBottom: "1px",
      opacity: 0.7,
    },
  }));

  return <ListSubheaderStyle>{item.subheader}</ListSubheaderStyle>;
};

NavGroup.propTypes = {
  item: PropTypes.object,
};

export default NavGroup;
