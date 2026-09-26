import { SearchInput } from '.';

export default {
  title: 'SearchInput',
  component: SearchInput,
  args: {
    children: 'SearchInput',
  },
  argTypes: {
    children: { type: 'string' },
  },
};

export const Template = (args) => {
  return (
    <div>
      <SearchInput {...args} />
    </div>
  );
};
