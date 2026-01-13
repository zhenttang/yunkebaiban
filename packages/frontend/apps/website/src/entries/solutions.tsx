import React from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import Layout from '../components/Layout';
import Solutions from '../pages/Solutions';

createRoot(document.getElementById('app')!).render(
  <Layout>
    <Solutions />
  </Layout>
);
