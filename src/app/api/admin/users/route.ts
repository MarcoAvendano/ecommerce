import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInternalUserSchema } from "@/features/auth/schemas";
import type {
  AdminUserListItem,
  AdminUsersListResponse,
  CreateInternalUserResponse,
} from "@/features/auth/admin-users.types";

async function requireAdminRequest() {
  const authContext = await getAuthContext();

  if (!authContext) {
    return {
      error: NextResponse.json({ message: "No autenticado." }, { status: 401 }),
    };
  }

  if (!authContext.isAdmin) {
    return {
      error: NextResponse.json({ message: "No autorizado." }, { status: 403 }),
    };
  }

  return { authContext };
}

export async function GET() {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const adminClient = createAdminClient();

  const [
    { data: profiles, error: profilesError },
    { data: roleAssignments, error: roleAssignmentsError },
    { data: roles, error: rolesError },
    { data: usersPage, error: listUsersError },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, email, full_name, status, created_at"),
    adminClient.from("user_roles").select("user_id, role_id"),
    adminClient.from("roles").select("id, code, name"),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesError || roleAssignmentsError || rolesError || listUsersError) {
    return NextResponse.json(
      {
        message:
          profilesError?.message ??
          roleAssignmentsError?.message ??
          rolesError?.message ??
          listUsersError?.message ??
          "No se pudo cargar el listado de usuarios.",
      },
      { status: 500 },
    );
  }

  const authUsersById = new Map(usersPage.users.map((user) => [user.id, user]));
  const rolesById = new Map((roles ?? []).map((role) => [role.id, role]));
  const rolesByUserId = new Map<string, { code: string; name: string }[]>();

  for (const assignment of roleAssignments ?? []) {
    const role = rolesById.get(assignment.role_id);

    if (!role) {
      continue;
    }

    const currentRoles = rolesByUserId.get(assignment.user_id) ?? [];
    currentRoles.push({ code: role.code, name: role.name });
    rolesByUserId.set(assignment.user_id, currentRoles);
  }

  const users: AdminUserListItem[] = (profiles ?? [])
    .map((profile) => {
      const authUser = authUsersById.get(profile.id);
      const assignedRoles = rolesByUserId.get(profile.id) ?? [];

      return {
        id: profile.id,
        email: profile.email || authUser?.email || "",
        fullName: profile.full_name,
        status: profile.status,
        createdAt: profile.created_at,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        roleCodes: assignedRoles.map((role) => role.code),
        roleNames: assignedRoles.map((role) => role.name),
      };
    })
    .sort((left, right) => {
      const leftDate = new Date(left.createdAt).getTime();
      const rightDate = new Date(right.createdAt).getTime();
      return rightDate - leftDate;
    });

  const responseBody: AdminUsersListResponse = { users };

  return NextResponse.json(responseBody);
}

export async function POST(request: Request) {
  const adminRequest = await requireAdminRequest();

  if (adminRequest.error) {
    return adminRequest.error;
  }

  const payload = await request.json();
  const parsedPayload = createInternalUserSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        message: "Datos invalidos.",
        errors: parsedPayload.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const adminClient = createAdminClient();
  const { email, fullName, password, roleCode } = parsedPayload.data;

  const [{ data: role, error: roleError }, { data: usersPage, error: listUsersError }] =
    await Promise.all([
      adminClient.from("roles").select("id, code").eq("code", roleCode).maybeSingle(),
      adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  if (roleError || !role) {
    return NextResponse.json({ message: roleError?.message ?? "Rol no encontrado." }, { status: 400 });
  }

  if (listUsersError) {
    return NextResponse.json({ message: listUsersError.message }, { status: 500 });
  }

  const existingUser = usersPage.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existingUser) {
    return NextResponse.json(
      { message: "Ya existe un usuario con ese correo." },
      { status: 409 },
    );
  }

  const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createUserError || !createdUser.user) {
    return NextResponse.json(
      { message: createUserError?.message ?? "No se pudo crear el usuario." },
      { status: 400 },
    );
  }

  const userId = createdUser.user.id;

  const [{ error: profileError }, { error: roleAssignmentError }] = await Promise.all([
    adminClient.from("profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        status: "active",
      },
      { onConflict: "id" },
    ),
    adminClient.from("user_roles").upsert(
      {
        user_id: userId,
        role_id: role.id,
      },
      { onConflict: "user_id,role_id" },
    ),
  ]);

  if (profileError || roleAssignmentError) {
    return NextResponse.json(
      {
        message: profileError?.message ?? roleAssignmentError?.message ?? "No se pudo guardar el rol.",
      },
      { status: 500 },
    );
  }

  const responseBody: CreateInternalUserResponse = {
    message: "Usuario creado correctamente.",
    user: {
      id: userId,
      email,
      fullName,
      roleCode,
    },
  };

  return NextResponse.json(
    responseBody,
    { status: 201 },
  );
}