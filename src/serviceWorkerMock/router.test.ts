import { Router, Route } from './router';

describe('Router', () => {
  describe('constructor', () => {
    it('should build the trie', () => {
      const routes = [
        { path: '/users', handler: () => {} },
        { path: '/users/:id', handler: () => {} },
        { path: '/posts/:id/comments/:commentId', handler: () => {} },
      ];
      const router = new Router(routes);
      expect(router.match('/users')).toEqual({
        handler: routes[0].handler,
        params: {},
      });
      expect(router.match('/users/1')).toEqual({
        handler: routes[1].handler,
        params: { id: '1' },
      });
      expect(router.match('/posts/1/comments/2')).toEqual({
        handler: routes[2].handler,
        params: { id: '1', commentId: '2' },
      });
    });
  });

  describe('add', () => {
    it('should add a new route and rebuild the trie', () => {
      const routes = [
        { path: '/users', handler: () => {} },
        { path: '/users/:id', handler: () => {} },
      ];
      const router = new Router(routes);
      router.add({ path: '/posts', handler: () => {} });
      expect(router.match('/posts')).toEqual({
        handler: expect.any(Function),
        params: {},
      });
    });
  });

  describe('match', () => {
    it('should return the handler and params for a matching path', () => {
      const routes = [
        { path: '/users', handler: () => {} },
        { path: '/users/:id', handler: () => {} },
        { path: '/posts/:id/comments/:commentId', handler: () => {} },
      ];
      const router = new Router(routes);
      expect(router.match('/users')).toEqual({
        handler: routes[0].handler,
        params: {},
      });
      expect(router.match('/users/1')).toEqual({
        handler: routes[1].handler,
        params: { id: '1' },
      });
      expect(router.match('/posts/1/comments/2')).toEqual({
        handler: routes[2].handler,
        params: { id: '1', commentId: '2' },
      });
    });

    it('should return null handler and empty params for a non-matching path', () => {
      const routes = [{ path: '/users', handler: () => {} }];
      const router = new Router(routes);
      expect(router.match('/posts')).toEqual({ handler: null, params: {} });
    });
  });
});

describe('Router2', () => {
  let router: Router;

  beforeEach(() => {
    router = new Router([]);
  });

  it('should match nested paths', () => {
    const route1: Route = { path: '/users', handler: jest.fn() };
    const route2: Route = { path: '/users/:id', handler: jest.fn() };
    router.add(route1);
    router.add(route2);

    expect(router.match('/users').handler).toBe(route1.handler);
    expect(router.match('/users/123').handler).toBe(route2.handler);
  });

  it('should handle multiple params in a single path', () => {
    const route: Route = {
      path: '/users/:userId/posts/:postId',
      handler: jest.fn(),
    };
    router.add(route);

    const { params } = router.match('/users/123/posts/456');
    expect(params).toEqual({ userId: '123', postId: '456' });
  });

  it('should handle optional segments in a path', () => {
    const route: Route = {
      path: '/users/:id/posts/:postId?',
      handler: jest.fn(),
    };
    router.add(route);

    expect(router.match('/users/123/posts').handler).toBe(route.handler);
    expect(router.match('/users/123/posts/456').handler).toBe(route.handler);
  });

  it('should handle complex path patterns', () => {
    const route1: Route = { path: '/users', handler: jest.fn() };
    const route2: Route = { path: '/users/:id', handler: jest.fn() };
    const route3: Route = { path: '/users/:id/posts', handler: jest.fn() };
    const route4: Route = {
      path: '/users/:id/posts/:postId',
      handler: jest.fn(),
    };
    const route5: Route = { path: '/posts/:postId', handler: jest.fn() };
    router.add(route1);
    router.add(route2);
    router.add(route3);
    router.add(route4);
    router.add(route5);

    expect(router.match('/users').handler).toBe(route1.handler);
    expect(router.match('/users/123').handler).toBe(route2.handler);
    expect(router.match('/users/123/posts').handler).toBe(route3.handler);
    expect(router.match('/users/123/posts/456').handler).toBe(route4.handler);
    expect(router.match('/posts/789').handler).toBe(route5.handler);
  });

  it('should handle wildcard params in a path', () => {
    const route: Route = { path: '/users/:userId/*', handler: jest.fn() };
    router.add(route);

    const { params, handler } = router.match('/users/123/posts/456');
    expect(handler).toBe(route.handler);

    expect(params).toEqual({ userId: '123' });
  });
});
