import React from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import Layout from '../components/Layout';
import Home from '../pages/Home';

createRoot(document.getElementById('app')!).render(
  <Layout>
    <Home />
  </Layout>
);
