import { FinanceCalculator } from './finance-calculator';

describe('FinanceCalculator', () => {
  it('computes opening, income, expense and closing balance by currency', () => {
    expect(
      FinanceCalculator.fundReport(
        {
          id: 'fund-1',
          name: 'Caisse ordinaire',
          currency: 'CDF',
          initialBalance: '1000',
        },
        [{ amount: '500', currency: 'CDF', occurredAt: new Date() }],
        [
          { amount: '250', currency: 'CDF', occurredAt: new Date() },
          { amount: '-100', currency: 'CDF', occurredAt: new Date() },
        ],
      ),
    ).toMatchObject({
      openingBalance: 1500,
      income: 250,
      expense: 100,
      netMovement: 150,
      closingBalance: 1650,
    });
  });

  it('refuses implicit currency mixing', () => {
    expect(() =>
      FinanceCalculator.fundReport(
        {
          id: 'fund-1',
          name: 'Caisse ordinaire',
          currency: 'CDF',
          initialBalance: 0,
        },
        [],
        [{ amount: 10, currency: 'USD', occurredAt: new Date() }],
      ),
    ).toThrow('FINANCE_CURRENCY_MISMATCH');
  });
});
