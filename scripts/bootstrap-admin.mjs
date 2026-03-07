import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const adminFullName = process.env.BOOTSTRAP_ADMIN_FULL_NAME ?? 'Administrador General';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

if (!adminEmail || !adminPassword) {
  throw new Error('Missing BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function bootstrapAdmin() {
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id, code')
    .eq('code', 'admin')
    .maybeSingle();

  if (roleError || !role) {
    throw new Error(roleError?.message ?? 'Admin role not found. Run migrations first.');
  }

  const { data: usersPage, error: listUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listUsersError) {
    throw new Error(listUsersError.message);
  }

  const existingUser = usersPage.users.find(
    (user) => user.email?.toLowerCase() === adminEmail.toLowerCase(),
  );

  let userId = existingUser?.id;

  if (!existingUser) {
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminFullName,
      },
    });

    if (createUserError || !createdUser.user) {
      throw new Error(createUserError?.message ?? 'Unable to create bootstrap admin user.');
    }

    userId = createdUser.user.id;
    console.log(`Created admin user ${adminEmail}.`);
  } else {
    const { error: updateUserError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        full_name: adminFullName,
      },
    });

    if (updateUserError) {
      throw new Error(updateUserError.message);
    }

    console.log(`Admin user ${adminEmail} already existed. Credentials were refreshed.`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email: adminEmail,
      full_name: adminFullName,
      status: 'active',
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: roleAssignmentError } = await supabase.from('user_roles').upsert(
    {
      user_id: userId,
      role_id: role.id,
    },
    { onConflict: 'user_id,role_id' },
  );

  if (roleAssignmentError) {
    throw new Error(roleAssignmentError.message);
  }

  console.log(`Bootstrap admin ready: ${adminEmail}`);
}

bootstrapAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});