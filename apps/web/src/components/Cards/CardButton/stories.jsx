import { CardButton } from '.';

export default {
  title: 'CardButton',
  component: CardButton,
  args: {
    children: 'CardButton',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <CardButton {...args} />
    </div>
  );
};
