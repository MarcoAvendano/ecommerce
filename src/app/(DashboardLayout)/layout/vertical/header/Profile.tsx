"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Menu,
  Avatar,
  Typography,
  Divider,
  Button,
  IconButton,
} from '@mui/material';
import * as dropdownData from './data';
import { createClient } from '@/lib/supabase/client';
import { useProfileQuery } from '@/features/settings/settings.queries';
import { IconMail } from '@tabler/icons-react';
import { Stack } from '@mui/system';
import Image from 'next/image';

const DEFAULT_AVATAR = "/images/profile/user-1.jpg";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const profileQuery = useProfileQuery();
  const profile = profileQuery.data?.profile;
  const avatarSrc   = profile?.avatar_url  ?? DEFAULT_AVATAR;
  const displayName = profile?.full_name   ?? "Usuario";
  const roleLabel   = profile?.isAdmin     ? "Administrador" : "Usuario";
  const emailText   = profile?.email       ?? "";

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError(error.message);
      return;
    }

    window.location.href = '/auth/login';
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="perfil de usuario"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={avatarSrc}
          alt={displayName}
          sx={{ width: 35, height: 35 }}
        />
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Profile Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '360px',
            p: 4,
          },
        }}
      >
        {logoutError ? <Alert severity="error" sx={{ mb: 2 }}>{logoutError}</Alert> : null}
        <Typography variant="h5">Perfil</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          <Avatar
            src={avatarSrc}
            alt={displayName}
            sx={{ width: 95, height: 95 }}
          />
          <Box>
            <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
              {displayName}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {roleLabel}
            </Typography>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <IconMail width={15} height={15} />
              {emailText}
            </Typography>
          </Box>
        </Stack>
        <Box mt={2}>
          <Button variant="outlined" color="primary" fullWidth onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
