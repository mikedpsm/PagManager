import { ClientsCard } from '.';

export default {
  title: 'ClientsCard',
  component: ClientsCard,
  args: {
    title: 'Clientes Inadimplentes',
    count: 6,
    charges: {
      name: 'Jonatas',
      id: 8,
      cpf: '05616370169'
    },
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <ClientsCard {...args} />
    </div>
  );
};
