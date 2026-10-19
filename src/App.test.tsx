import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useOutletContext } from 'react-router-dom';
import App from './App';

// The real firebase.js connects to Firebase as soon as it's imported, which needs the app's config (not set in
// tests). These tests are signed out, so nothing here talks to the database.
jest.mock('./firebase', () => ({
  auth: {},
  signInWithGoogle: jest.fn(),
  logout: jest.fn(),
  updateUsersUDiscName: jest.fn(),
  listenToPath: jest.fn(() => () => {}),
}));
jest.mock('react-firebase-hooks/auth', () => ({ useAuthState: () => [null, false] }));

const renderAt = (path: string) => {
  // Stands in for a page, and shows what App passes down to it
  function Page () {
    const [user] = useOutletContext<[unknown]>();
    return <p>Page for {user === null ? 'a visitor' : 'a member'}</p>;
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="rankings" element={<Page />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

test('shows the signed-out home page at /', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { level: 1, name: 'Disc Golf Manager' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Log in with Google' })).toBeInTheDocument();
});

test('shows other pages inside the layout and passes them the user', () => {
  renderAt('/rankings');
  expect(screen.getByText('Page for a visitor')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Log in with Google' })).not.toBeInTheDocument();
});
