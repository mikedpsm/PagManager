import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldLabel, Input } from './input';

const meta = {
  component: Input,
  title: 'UI/Input',
  args: { placeholder: 'voce@email.com' },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'email-invalido' },
};
export const Labeled: Story = {
  render: (args) => (
    <div className="w-80">
      <FieldLabel htmlFor="storybook-email">E-mail</FieldLabel>
      <Input id="storybook-email" {...args} />
    </div>
  ),
};
