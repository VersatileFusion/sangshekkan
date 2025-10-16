import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function requireAuth() {
	const session = await auth();
	if (!session?.user) {
		return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
	}
	return { session };
}

export async function requireAdvisor() {
	const { session, error } = await requireAuth();
	if (error) return { error };
	const userQuery = await sql`
		SELECT * FROM users WHERE auth_user_id = ${session.user.id}
	`;
	if (userQuery.length === 0) {
		return { error: Response.json({ error: "User not found" }, { status: 404 }) };
	}
	const currentUser = userQuery[0];
	const devBypass = process.env.DEV_ALLOW_ADVISOR_EMAIL_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
	const isAdvisor = currentUser.role === "advisor" || (devBypass && session.user.email === "melika.sangshakan@advisor.com");
	if (!isAdvisor) {
		return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
	}
	return { session, currentUser };
}

export async function requireAdminSecret(request) {
	const provided = request.headers.get("x-admin-secret");
	const expected = process.env.ADMIN_SETUP_SECRET;
	if (!expected || provided !== expected) {
		return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
	}
	return {};
}


