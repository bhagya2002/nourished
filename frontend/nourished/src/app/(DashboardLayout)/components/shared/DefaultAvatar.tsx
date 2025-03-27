'use client';
import { Avatar, AvatarProps } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

interface DefaultAvatarProps extends AvatarProps {
  name?: string;
}

const DefaultAvatar = ({ name, sx, ...props }: DefaultAvatarProps) => {
  return (
    <Avatar
      sx={{
        bgcolor: 'grey.200',
        color: 'grey.600',
        ...sx
      }}
      {...props}
    >
      {name ? name.charAt(0).toUpperCase() : <PersonOutlineIcon />}
    </Avatar>
  );
};

export default DefaultAvatar; 