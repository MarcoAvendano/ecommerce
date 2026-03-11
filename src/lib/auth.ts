import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthProfile {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
}

export interface AuthContext {
  user: {
    id: string;
    email: string | undefined;
    name: string | undefined;
  };
  profile: AuthProfile | null;
  isAdmin: boolean;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: isAdmin, error: adminError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, status")
      .eq("id", user.id)
      .maybeSingle<AuthProfile>(),
    supabase.rpc("has_role", { required_role: "admin" }),
  ]);

  if (adminError) {
    throw new Error(adminError.message);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: profile?.full_name || undefined,
    },
    profile,
    isAdmin: Boolean(isAdmin),
  };
}

export async function hasAnyRole(requiredRoles: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_any_role", {
    required_roles: requiredRoles,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function requireAuth() {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/auth/login");
  }

  return authContext;
}

export async function requireAdmin() {
  const authContext = await requireAuth();

  if (!authContext.isAdmin) {
    redirect("/");
  }

  return authContext;
}

export async function requireAnyRole(requiredRoles: string[]) {
  const authContext = await requireAuth();

  if (authContext.isAdmin) {
    return authContext;
  }

  const isAllowed = await hasAnyRole(requiredRoles);

  if (!isAllowed) {
    redirect("/");
  }

  return authContext;
}
