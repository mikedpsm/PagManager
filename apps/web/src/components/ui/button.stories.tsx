import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';

const meta = {
  component: Button,
  title: 'UI/Button',
  args: { children: 'Salvar' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancelar' },
};
export const Destructive: Story = {
  args: { variant: 'danger', children: 'Excluir' },
};
export const Disabled: Story = {
  args: { disabled: true, children: 'Indisponível' },
};
