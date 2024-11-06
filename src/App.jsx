import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AdminChat from './components/AdminChat';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminChat />,
  },
]);

const App = () => {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
