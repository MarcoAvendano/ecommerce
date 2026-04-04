import React from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Avatar, Typography, Card, CardContent, Grid, Divider, Stack, Chip } from '@mui/material';
import { IconArrowDownRight, IconArrowUpRight } from  '@tabler/icons-react';
import Image from 'next/image';

interface WelcomeCardProps {
  userName?: string;
  businessName?: string | null;
  periodLabel?: string;
  totalSalesLabel?: string;
  orderCountLabel?: string;
  averageTicketLabel?: string;
  growthRate?: number;
  periodControl?: React.ReactNode;
}

const WelcomeCard = ({
  userName = 'Mathew Anderson',
  businessName,
  periodLabel = 'Mes actual',
  totalSalesLabel = '$0.00',
  orderCountLabel = '0',
  averageTicketLabel = '$0.00',
  growthRate = 0,
  periodControl,
}: WelcomeCardProps) => {
  const isPositiveGrowth = growthRate >= 0;
  const growthIcon = isPositiveGrowth ? <IconArrowUpRight width={18} /> : <IconArrowDownRight width={18} />;

  return (
    <Card
      elevation={0}
      sx={{
        py: 0,
        overflow: 'hidden',
        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
      }}
    >
      <CardContent sx={{ py: 4, px: { xs: 3, md: 4 } }}>
        <Grid container justifyContent="space-between" spacing={3} alignItems="center">
          <Grid item xs={12} md={7} display="flex" alignItems="center">
            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={2}
                mb={4}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                <Box
                  gap="16px"
                sx={{
                  display: {
                    xs: 'block',
                    sm: 'flex',
                  },
                  alignItems: 'center',
                }}
              >
                <Avatar src='/images/profile/user-1.jpg' alt="img" sx={{ width: 48, height: 48 }} />
                <Box>
                  <Typography variant="h5" whiteSpace="nowrap">
                    Bienvenido de nuevo, {userName}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary">
                    {businessName ?? 'Resumen ejecutivo del negocio'}
                  </Typography>
                </Box>
              </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Chip label={periodLabel} color="primary" size="small" />
                  {periodControl}
                </Stack>
              </Stack>

              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} divider={<Divider orientation="vertical" flexItem />}>
                <Box minWidth={180}>
                  <Typography variant="h2" whiteSpace="nowrap">{totalSalesLabel}</Typography>
                  <Typography variant="subtitle1" whiteSpace="nowrap">Ventas confirmadas</Typography>
                </Box>
                <Box minWidth={160}>
                  <Typography variant="h2" whiteSpace="nowrap">
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      {growthRate}%
                      <Box component="span" sx={{ color: isPositiveGrowth ? '#39B69A' : 'error.main', display: 'inline-flex' }}>
                        {growthIcon}
                      </Box>
                    </Box>
                  </Typography>
                  <Typography variant="subtitle1" whiteSpace="nowrap">Variacion del periodo</Typography>
                </Box>
                <Box minWidth={160}>
                  <Typography variant="h2" whiteSpace="nowrap">{orderCountLabel}</Typography>
                  <Typography variant="subtitle1" whiteSpace="nowrap">Ordenes cerradas</Typography>
                </Box>
                <Box minWidth={160}>
                  <Typography variant="h2" whiteSpace="nowrap">{averageTicketLabel}</Typography>
                  <Typography variant="subtitle1" whiteSpace="nowrap">Ticket promedio</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box mb={{ xs: -2, md: -5 }} display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }}>
              <Image src='/images/backgrounds/welcome-bg.svg' alt='img' width={340} height={204} style={{ width: "340px", height: "204px", maxWidth: '100%' }} />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
