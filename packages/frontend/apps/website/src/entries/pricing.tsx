import React from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import Layout from '../components/Layout';
import Pricing from '../pages/Pricing';

createRoot(document.getElementById('app')!).render(
  <Layout>
    <Pricing />
  </Layout>
);
