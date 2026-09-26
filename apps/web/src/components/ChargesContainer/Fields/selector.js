export const selector = (status) => {
  if (status === 'Paid') {
    return {
      background: '#acd9c5',
      color: '#0e8750',
      name: 'Pago'
    }
  }
  if (status == 'Partially paid' || status == 'Pending') {
    return {
      background: '#f5d9b0',
      color: '#ef8f00',
      name: 'Pendente',
    }
  }
  if (status === 'Overdue') {
    return {
      background: '#f2d6d0',
      color: '#ae1100',
      name: 'Vencida',
    }
  }
}
