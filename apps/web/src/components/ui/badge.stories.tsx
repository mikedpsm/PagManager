import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './badge';

const meta = {
  component: Badge,
  title: 'UI/Badge',
  args: { children: 'Em dia' },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Paid: Story = { args: { variant: 'paid', children: 'Paga' } };
export const Pending: Story = {
  args: { variant: 'pending', children: 'Pendente' },
};
export const Overdue: Story = {
  args: { variant: 'overdue', children: 'Em atraso' },
};
