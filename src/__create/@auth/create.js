import { getToken } from '@auth/core/jwt';
import { getContext } from 'hono/context-storage';

export default function CreateAuth() {
	const auth = async () => {
		const c = getContext();
		const token = await getToken({
			req: c.req.raw,
			secret: process.env.AUTH_SECRET,
			secureCookie: Boolean(process.env.AUTH_URL && process.env.AUTH_URL.startsWith('https')),
		});
		if (token) {
			return {
				user: {
					id: token.sub,
					email: token.email,
					name: token.name,
					image: token.picture,
					role: token.role, // ✅ Extract role from JWT token
					phone: token.phone, // ✅ Extract phone from JWT token
				},
				expires: token.exp.toString(),
			};
		}
	};
	return {
		auth,
	};
}
