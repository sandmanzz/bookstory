import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { ProfilesProvider } from './profiles';
import { Layout } from './components/Layout';
import { Account } from './pages/Account';
import { AdminOnly } from './components/AdminOnly';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminForm } from './pages/admin/AdminForm';
import { AdminList } from './pages/admin/AdminList';
import { BookDetail, NotFound } from './pages/BookDetail';
import { Library } from './pages/Library';
import { Login } from './pages/Login';
import { Plans } from './pages/Plans';
import { Puzzles } from './pages/Puzzles';
import { Reader } from './pages/Reader';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ProfilesProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Library />} />
                <Route path="books/:slug" element={<BookDetail />} />
                <Route path="read/:slug" element={<Reader />} />
                <Route path="plans" element={<Plans />} />
                <Route path="puzzles" element={<Puzzles />} />
                <Route path="login" element={<Login />} />
                <Route path="account" element={<Account />} />
                <Route
                  path="admin"
                  element={
                    <AdminOnly>
                      <AdminList />
                    </AdminOnly>
                  }
                />
                <Route
                  path="admin/new"
                  element={
                    <AdminOnly>
                      <AdminForm />
                    </AdminOnly>
                  }
                />
                <Route
                  path="admin/:slug"
                  element={
                    <AdminOnly>
                      <AdminForm />
                    </AdminOnly>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </ProfilesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
