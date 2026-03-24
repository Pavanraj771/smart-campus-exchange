import { render, screen } from '@testing-library/react';
import RequestsPage from './pages/RequestsPage';
import ResourcesPage from './pages/ResourcesPage';

jest.mock(
  'react-router-dom',
  () => ({
    Link: ({ children }) => <span>{children}</span>
  }),
  { virtual: true }
);

const resources = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  title: `Resource ${index + 1}`,
  category: index % 2 === 0 ? 'Books' : 'Electronics',
  owner: 'Owner Name',
  ownerEmail: 'owner@nitw.ac.in',
  department: 'CSE',
  condition: 'Good',
  availability: 'Available',
  location: 'Library',
  rating: 4.5,
  description: 'Useful campus resource for testing.',
  image: 'https://example.com/image.png',
  createdAt: `2026-03-${String(index + 1).padStart(2, '0')}T00:00:00Z`
}));

test('resources page paginates after six items', () => {
  render(<ResourcesPage resources={resources} />);

  expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
  expect(screen.getByText('Resource 7')).toBeInTheDocument();
});

test('requests page shows cancel action only for pending requests', () => {
  render(
    <RequestsPage
      requests={[
        {
          id: 'RQ-1',
          item: 'DBMS Textbook',
          requester: 'Student One',
          requesterEmail: 'student@nitw.ac.in',
          duration: '3 days',
          message: 'Need it for finals.',
          status: 'Pending'
        },
        {
          id: 'RQ-2',
          item: 'Circuit Kit',
          requester: 'Student One',
          requesterEmail: 'student@nitw.ac.in',
          duration: '5 days',
          message: '',
          status: 'Approved'
        }
      ]}
      currentUser={{ email: 'student@nitw.ac.in' }}
      onCancelRequest={() => {}}
      activeRequestId={null}
    />
  );

  expect(screen.getByRole('button', { name: /cancel request/i })).toBeInTheDocument();
  expect(screen.getAllByText(/no action/i).length).toBeGreaterThan(0);
});
