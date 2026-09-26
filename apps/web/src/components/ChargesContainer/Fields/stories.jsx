import { ChargesFields } from '.';

export default {
  title: 'ChargesFields',
  component: ChargesFields,
  args: {
    client_name: 'Sarah',
    charge_id: 'P.string.isRequired',
    charge_amount: 'P.string.isRequired',
    charge_date: new Date(),
    charge_desc: 'asjkdhoauswdfhalsjdfh',
  },
};

export const Template = (args) => {
  return (
    <div>
      <ChargesFields {...args} />
    </div>
  );
};
