import { render, screen } from '@testing-library/react';
import App from './App';

test('renders platform title', () => {
  render(<App />);
  const headingElement = screen.getByText(/smart campus resource exchange/i);
  expect(headingElement).toBeInTheDocument();
});
