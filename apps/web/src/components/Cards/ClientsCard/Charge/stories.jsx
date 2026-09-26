import { Charge } from '.';

export default {
  title: 'Charge',
  component: Charge,
  args: {
    client_name: 'Sonia Valadão',
    charge_value: '14660',
    charge_date: new Date().toLocaleDateString(),
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <Charge {...args} />
    </div>
  );
};
