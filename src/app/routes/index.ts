import { Router } from 'express';
import { authRoute } from '../modules/auth/route.auth';
import { categoryRoutes } from '../modules/category/router.category';
import { productRoutes } from '../modules/product/router.product';
import { orderRoutes } from '../modules/order/route.order';
import { userRoutes } from '../modules/user/route.user';
import { cartRoutes } from '../modules/cart/route.cart';
import { ImageUploads } from '../modules/upload/route.upload';
import { wishlistRoutes } from '../modules/wishlist/route.wishlist';
import { settingsRoutes } from '../modules/settings/route.settings';
import { reviewRoutes } from '../modules/review/route.review';
import { homepageRoutes } from '../modules/homepage/route.homepage';

const router = Router();

const moduleRoute = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/categories',
    route: categoryRoutes,
  },
  {
    path: '/products',
    route: productRoutes,
  },
  {
    path: '/orders',
    route: orderRoutes,
  },
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/carts',
    route: cartRoutes,
  },
  {
    path: '/uploads',
    route: ImageUploads,
  },
  {
    path: '/wishlist',
    route: wishlistRoutes,
  },
  {
    path: '/settings',
    route: settingsRoutes,
  },
  {
    path: '/reviews',
    route: reviewRoutes,
  },
  {
    path: '/homepage',
    route: homepageRoutes,
  },
];

moduleRoute.forEach((routeObj) => router.use(routeObj.path, routeObj.route));

export default router;
