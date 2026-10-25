import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateBudgetAlert } from "./alert.generator.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    budget: { findFirst: vi.fn() },
    transaction: { findMany: vi.fn() },
    alert: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

describe("generateBudgetAlert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée une alerte si le budget est dépassé et qu'aucune n'existe", async () => {
    // Arrange : budget de 100, dépenses de 80 + 70 = 150 → dépassement de 50
    vi.mocked(prisma.budget.findFirst).mockResolvedValue({
      limit_amount: 100,
      category: { id: 3 },
    } as any);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { amount: 80 },
      { amount: 70 },
    ] as any);
    vi.mocked(prisma.alert.findFirst).mockResolvedValue(null);

    // Act : appeler la vraie fonction (budgetId = 1, userId = 7)
    await generateBudgetAlert(1, 7);

    // Assert : une alerte créée avec le bon montant, aucune mise à jour
    expect(prisma.alert.create).toHaveBeenCalledTimes(1);
    expect(prisma.alert.create).toHaveBeenCalledWith({
      data: { userId: 7, categoryId: 3, exceededAmount: 50 },
    });
    expect(prisma.alert.update).not.toHaveBeenCalled();
  });

  it("ne crée pas de doublon si une alerte non lue existe déjà", async () => {
    // Arrange : budget dépassé (150 > 100) + une alerte déjà là, pas encore lue
    vi.mocked(prisma.budget.findFirst).mockResolvedValue({
      limit_amount: 100,
      category: { id: 3 },
    } as any);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { amount: 80 },
      { amount: 70 },
    ] as any);
    const existingAlert = { id: 12, isRead: false };
    vi.mocked(prisma.alert.findFirst).mockResolvedValue(existingAlert as any);

    // Act
    const result = await generateBudgetAlert(1, 7);

    // Assert : on renvoie l'alerte existante, sans rien créer ni modifier
    expect(result).toEqual(existingAlert);
    expect(prisma.alert.create).not.toHaveBeenCalled();
    expect(prisma.alert.update).not.toHaveBeenCalled();
  });

  it("réactive une alerte déjà lue si le budget est de nouveau dépassé", async () => {
    // Arrange : budget dépassé (150 > 100) + une alerte déjà lue par l'utilisateur
    vi.mocked(prisma.budget.findFirst).mockResolvedValue({
      limit_amount: 100,
      category: { id: 3 },
    } as any);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { amount: 80 },
      { amount: 70 },
    ] as any);
    vi.mocked(prisma.alert.findFirst).mockResolvedValue({
      id: 12,
      isRead: true,
    } as any);

    // Act
    await generateBudgetAlert(1, 7);

    // Assert : l'alerte repasse en non-lue avec le montant à jour, pas de nouvelle alerte
    expect(prisma.alert.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: { isRead: false, exceededAmount: 50 },
    });
    expect(prisma.alert.create).not.toHaveBeenCalled();
  });

  it("retire l'alerte si les dépenses repassent sous la limite", async () => {
    // Arrange : dépenses de 60 + 40 = 100, pile à la limite → pas un dépassement
    vi.mocked(prisma.budget.findFirst).mockResolvedValue({
      limit_amount: 100,
      category: { id: 3 },
    } as any);
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([
      { amount: 60 },
      { amount: 40 },
    ] as any);

    // Act
    const result = await generateBudgetAlert(1, 7);

    // Assert : la fonction s'arrête avant même de chercher une alerte existante
    expect(result).toBeNull();
    expect(prisma.alert.findFirst).not.toHaveBeenCalled();
    expect(prisma.alert.create).not.toHaveBeenCalled();
    expect(prisma.alert.update).not.toHaveBeenCalled();
    expect(prisma.alert.deleteMany).toHaveBeenCalledWith({
      where: { userId: 7, categoryId: 3 },
    });
  });
});
