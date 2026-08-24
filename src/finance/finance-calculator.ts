export type MoneyInput = number | string | { toString(): string };

export type FinanceMovementInput = {
  amount: MoneyInput;
  currency: string;
  occurredAt: Date;
};

export type FundReportInput = {
  id: string;
  name: string;
  currency: string;
  initialBalance: MoneyInput;
};

export class FinanceCalculator {
  static toNumber(value: MoneyInput): number {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
  }

  static sum(values: MoneyInput[]): number {
    return (
      Math.round(
        values.reduce<number>(
          (total, value) => total + this.toNumber(value),
          0,
        ) * 100,
      ) / 100
    );
  }

  static splitMovements(movements: FinanceMovementInput[]) {
    return {
      income: this.sum(
        movements
          .map((movement) => this.toNumber(movement.amount))
          .filter((amount) => amount > 0),
      ),
      expense: Math.abs(
        this.sum(
          movements
            .map((movement) => this.toNumber(movement.amount))
            .filter((amount) => amount < 0),
        ),
      ),
      net: this.sum(movements.map((movement) => movement.amount)),
    };
  }

  static fundReport(
    fund: FundReportInput,
    beforePeriod: FinanceMovementInput[],
    inPeriod: FinanceMovementInput[],
  ) {
    const currencies = new Set([
      fund.currency,
      ...beforePeriod.map((movement) => movement.currency),
      ...inPeriod.map((movement) => movement.currency),
    ]);
    if (currencies.size > 1) {
      throw new Error('FINANCE_CURRENCY_MISMATCH');
    }

    const openingBalance =
      this.toNumber(fund.initialBalance) +
      this.sum(beforePeriod.map((movement) => movement.amount));
    const period = this.splitMovements(inPeriod);

    return {
      fundId: fund.id,
      fundName: fund.name,
      currency: fund.currency,
      openingBalance: Math.round(openingBalance * 100) / 100,
      income: period.income,
      expense: period.expense,
      netMovement: period.net,
      closingBalance: Math.round((openingBalance + period.net) * 100) / 100,
    };
  }
}
