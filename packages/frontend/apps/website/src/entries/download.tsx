import React from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import Layout from '../components/Layout';
import Download from '../pages/Download';

createRoot(document.getElementById('app')!).render(
  <Layout>
    <Download />
  </Layout>
);
