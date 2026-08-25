import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Code-splitting : chaque page est un chunk chargé à la demande (bundle initial allégé).
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Games = lazy(() => import('./pages/Games'));
const Login = lazy(() => import('./pages/Login'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const CheckoutCancel = lazy(() => import('./pages/CheckoutCancel'));
const Orders = lazy(() => import('./pages/Orders'));
const PlayWhat = lazy(() => import('./pages/PlayWhat'));
const Checker = lazy(() => import('./pages/Checker'));
const Builder = lazy(() => import('./pages/Builder'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="boutique" element={<Shop />} />
        <Route path="produit/:id" element={<ProductDetail />} />
        <Route path="jeux" element={<Games />} />
        <Route path="jouer" element={<PlayWhat />} />
        <Route path="verificateur" element={<Checker />} />
        <Route path="builder" element={<Builder />} />
        <Route path="contact" element={<Contact />} />
        <Route path="confidentialite" element={<Privacy />} />
        <Route path="login" element={<Login />} />
        <Route path="panier" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="commandes" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
        <Route path="checkout/cancel" element={<CheckoutCancel />} />

        <Route path="admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="produits" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="support" element={<AdminSupport />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
