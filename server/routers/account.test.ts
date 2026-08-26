import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { accountRouter } from "./account";
import { fakeContext, fakeUser } from "./test-utils";

function caller(prisma: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  const user = fakeUser("client", {
    id: "user-1",
    name: "Épicerie Mont Kailash",
    email: "contact@montkailash.fr",
    customerId: null,
    ...overrides,
  });
  return accountRouter.createCaller(fakeContext(user, prisma));
}

const validInput = { siret: "51037842900018", address: "48 rue du Faubourg St-Denis, 75010 Paris" };

describe("account.completeRegistration", () => {
  it("crée l'établissement à partir des informations de la session", async () => {
    const customer = {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "cust-1" }),
    };
    const user = { update: vi.fn().mockResolvedValue({}) };

    const result = await caller({ customer, user }).completeRegistration(validInput);

    // Le nom et l'e-mail viennent de la session, jamais du corps de la requête.
    expect(customer.create).toHaveBeenCalledWith({
      data: {
        name: "Épicerie Mont Kailash",
        siret: validInput.siret,
        address: validInput.address,
        contactEmail: "contact@montkailash.fr",
      },
    });
    expect(result).toEqual({ customerId: "cust-1" });
  });

  it("rattache le compte et le verrouille sur le rôle client", async () => {
    const customer = {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "cust-1" }),
    };
    const user = { update: vi.fn().mockResolvedValue({}) };

    await caller({ customer, user }).completeRegistration(validInput);

    expect(user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { customerId: "cust-1", role: "client" },
    });
  });

  it("refuse un compte déjà rattaché à un établissement", async () => {
    const customer = { findUnique: vi.fn(), create: vi.fn() };
    const user = { update: vi.fn() };

    await expect(
      caller({ customer, user }, { customerId: "cust-existant" }).completeRegistration(validInput)
    ).rejects.toMatchObject({ code: "CONFLICT" });

    expect(customer.create).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
  });

  it("refuse un SIRET déjà utilisé par un autre établissement", async () => {
    const customer = {
      findUnique: vi.fn().mockResolvedValue({ id: "cust-existant" }),
      create: vi.fn(),
    };
    const user = { update: vi.fn() };

    await expect(caller({ customer, user }).completeRegistration(validInput)).rejects.toBeInstanceOf(
      TRPCError
    );
    expect(customer.create).not.toHaveBeenCalled();
  });

  it("refuse un SIRET ou une adresse trop courts", async () => {
    const customer = { findUnique: vi.fn(), create: vi.fn() };
    const user = { update: vi.fn() };

    await expect(
      caller({ customer, user }).completeRegistration({ ...validInput, siret: "123" })
    ).rejects.toThrow();
    await expect(
      caller({ customer, user }).completeRegistration({ ...validInput, address: "rue" })
    ).rejects.toThrow();
    expect(customer.create).not.toHaveBeenCalled();
  });

  it("exige une session : un visiteur anonyme est rejeté", async () => {
    const anonyme = accountRouter.createCaller(fakeContext(null, { customer: {}, user: {} }));
    await expect(anonyme.completeRegistration(validInput)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
