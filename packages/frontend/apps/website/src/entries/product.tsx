import React from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import Layout from '../components/Layout';
import Product from '../pages/Product';

createRoot(document.getElementById('app')!).render(
  <Layout>
    <Product />
  </Layout>
);
