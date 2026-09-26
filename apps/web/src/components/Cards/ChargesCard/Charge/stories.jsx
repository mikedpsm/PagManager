import { Charge } from '.';

export default {
  title: 'Charge',
  component: Charge,
  args: {
    client_name: 'Sonia Valadão',
    charge_value: 1600000000000,
    charge_id: 12265841,
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div style={{
      width: '25rem',
    }}>
      <Charge {...args} />
    </div>
  );
};
