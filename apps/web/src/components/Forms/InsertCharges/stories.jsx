import { InsertCharges } from '.';

export default {
  title: 'InsertCharges',
  component: InsertCharges,
  args: {
    children: 'InsertCharges',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <InsertCharges {...args} />
    </div>
  );
};
