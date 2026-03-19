export interface FineInterestResult {
  fineAmount: number;
  interestAmount: number;
  totalAmount: number;
  daysOverdue: number;
}

export function calculateFineInterest(
  principal: number,
  dueDate: Date,
  finePercent: number,
  interestPercentMonth: number,
  referenceDate: Date = new Date(),
): FineInterestResult {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const daysOverdue = Math.max(
    0,
    Math.floor((ref.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (daysOverdue === 0) {
    return { fineAmount: 0, interestAmount: 0, totalAmount: principal, daysOverdue: 0 };
  }

  const fineAmount = parseFloat(((principal * finePercent) / 100).toFixed(2));
  const dailyInterest = interestPercentMonth / 100 / 30;
  const interestAmount = parseFloat((principal * dailyInterest * daysOverdue).toFixed(2));

  return {
    fineAmount,
    interestAmount,
    totalAmount: parseFloat((principal + fineAmount + interestAmount).toFixed(2)),
    daysOverdue,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
