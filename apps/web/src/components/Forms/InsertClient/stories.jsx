import { InsertClient } from '.';

export default {
  title: 'InsertClient',
  component: InsertClient,
  args: {
    children: 'InsertClient',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <InsertClient {...args} />
    </div>
  );
};
