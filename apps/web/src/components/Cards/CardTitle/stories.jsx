import { CardTitle } from '.';


export default {
  title: 'CardTitle',
  component: CardTitle,
  args: {
    title_name: 'Clientes Inadimplentes',
    clients_count: 5,
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <CardTitle {...args} />
    </div>
  );
};
