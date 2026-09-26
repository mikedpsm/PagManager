export const filterAmounts = (data) => {
  const loyalClients = data.filter((ins) => {
    return ins.status == 'Paid';
  });

  const overdueClients = data.filter((ins) => {
    return ins.overdue_payment == 1;
  });

  const forseenClients = data.filter((ins) => {
    return ins.overdue_payment == 0 && (ins.status == 'Open' || ins.status == 'Partially paid');
  });

  const paidArr = loyalClients.map((cli) => {
    return cli.amount;
  });

  const pendingArr = forseenClients.map((cli) => {
    return cli.amount;
  });

  const overdueArr = overdueClients.map((cli) => {
    return cli.amount;
  });

  let paidValue = 0;
  let pendingValue = 0;
  let overdueValue = 0;

  for (let i = 0; i < paidArr.length; i++) {
    paidValue += paidArr[i];
  }
  for (let i = 0; i < pendingArr.length; i++) {
    pendingValue += pendingArr[i];
  }
  for (let i = 0; i < overdueArr.length; i++) {
    overdueValue += overdueArr[i];
  }

  return [
    {
      name: 'Cobranças Pagas',
      value: paidValue,
      obj: loyalClients
    },
    {
      name: 'Cobranças Previstas',
      value: pendingValue,
      obj: forseenClients
    },
    {
      name: 'Cobranças Vencidas',
      value: overdueValue,
      obj: overdueClients
    },
  ]
}

export const filteredClients = (loyal, debtors) => {
  return [
    {
      title: 'Clientes Inadimplentes',
      obj: debtors
    },
    {
      title: 'Clientes Em Dia',
      obj: loyal
    },
  ]
}
