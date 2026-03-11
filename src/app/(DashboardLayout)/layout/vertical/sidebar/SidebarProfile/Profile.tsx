"use client";

import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { IconPower } from '@tabler/icons-react';
import { useCustomizerStore } from '@/stores/use-customizer-store';
import { createClient } from '@/lib/supabase/client';
import { useProfileQuery } from '@/features/settings/settings.queries';

const DEFAULT_AVATAR = "/images/profile/user-1.jpg";

export const Profile = () => {
  const customizer = useCustomizerStore();
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';

  const profileQuery = useProfileQuery();
  const profile = profileQuery.data?.profile;
  const avatarSrc   = profile?.avatar_url ?? DEFAULT_AVATAR;
  const displayName = profile?.full_name  ?? "Usuario";
  const roleLabel   = profile?.isAdmin    ? "Administrador" : "Usuario";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: 'secondary.light' }}
    >
      {!hideMenu ? (
        <>
          <Avatar
            alt={displayName}
            src={avatarSrc}
            sx={{ height: 40, width: 40 }}
          />
          <Box>
            <Typography variant="h6" noWrap>{displayName}</Typography>
            <Typography variant="caption" noWrap>{roleLabel}</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Cerrar sesión" placement="top">
              <IconButton
                color="primary"
                onClick={handleLogout}
                aria-label="cerrar sesión"
                size="small"
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
