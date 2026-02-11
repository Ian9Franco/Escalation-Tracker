export const calculateNextBudget = (currentBudget: number, strategy: number = 0.2) => {
  return currentBudget * (1 + Number(strategy));
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};
