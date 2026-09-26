import { User } from '.';


export default {
  title: 'User',
  component: User,
  args: {
    children: 'User',
    aka: 'US',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <User {...args} />
  );
};
