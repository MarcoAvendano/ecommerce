import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInternalUserSchema } from "@/features/auth/schemas";

export async function POST(request: Request) {
  const authContext = await getAuthContext();

  if (!authContext) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  if (!authContext.isAdmin) {
    return NextResponse.json({ message: "No autorizado." }, { status: 403 });
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

  return NextResponse.json(
    {
      message: "Usuario creado correctamente.",
      user: {
        id: userId,
        email,
        fullName,
        roleCode,
      },
    },
    { status: 201 },
  );
}