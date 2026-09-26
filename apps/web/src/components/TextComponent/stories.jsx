import { TextComponent } from '.';

export default {
  title: 'TextComponent',
  component: TextComponent,
  args: {
    as: 'p',
    children: 'TextComponent',
    weight: '300',
    color: 'red'
  },
  argTypes: {
    children: { type: 'string' },
    as: { type: 'string' },
    weight: { type: 'string' },
    color: { type: 'string' }
  },
};

export const Template = (args) => {
  return (
    <div>
      <TextComponent {...args} />
    </div>
  );
};
