import { describe, expect, it } from "vitest";
import { getTestInstance } from "../../test-utils/test-instance";
import { passkey, passkeyClient } from ".";
import { createAuthClient } from "../../client";

describe("passkey", async () => {
	const { auth, signInWithTestUser, customFetchImpl } = await getTestInstance({
		plugins: [passkey()],
	});

	it("should generate register options", async () => {
		const { headers } = await signInWithTestUser();
		const options = await auth.api.generatePasskeyRegistrationOptions({
			headers: headers,
		});

		expect(options).toBeDefined();
		expect(options).toHaveProperty("challenge");
		expect(options).toHaveProperty("rp");
		expect(options).toHaveProperty("user");
		expect(options).toHaveProperty("pubKeyCredParams");

		const client = createAuthClient({
			plugins: [passkeyClient()],
			baseURL: "http://localhost:3000/api/auth",
			fetchOptions: {
				headers: headers,
				customFetchImpl,
			},
		});

		await client.$fetch("/passkey/generate-register-options", {
			headers: headers,
			method: "GET",
			onResponse(context) {
				const setCookie = context.response.headers.get("Set-Cookie");
				expect(setCookie).toBeDefined();
				expect(setCookie).toContain("better-auth-passkey");
			},
		});
	});

	it("should generate authenticate options", async () => {
		const { headers } = await signInWithTestUser();
		const options = await auth.api.generatePasskeyAuthenticationOptions({
			headers: headers,
		});

		expect(options).toBeDefined();
		expect(options).toHaveProperty("challenge");
		expect(options).toHaveProperty("rpId");
		expect(options).toHaveProperty("allowCredentials");
		expect(options).toHaveProperty("userVerification");
	});

	it("should list user passkeys", async () => {
		const { headers } = await signInWithTestUser();
		const passkeys = await auth.api.listPasskeys({
			headers: headers,
		});
		expect(Array.isArray(passkeys)).toBe(true);
		if (passkeys.length > 0) {
			expect(passkeys[0]).toHaveProperty("id");
			expect(passkeys[0]).toHaveProperty("userId");
			expect(passkeys[0]).toHaveProperty("publicKey");
		}
	});

	it("should delete a passkey", async () => {
		const { headers } = await signInWithTestUser();
		const deleteResult = await auth.api.deletePasskey({
			headers: headers,
			body: {
				id: "mockPasskeyId",
			},
		});

		expect(deleteResult).toBe(null);
	});
});
