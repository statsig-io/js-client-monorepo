import { StatsigUser, _getFullUserHash } from '../StatsigUser';

describe('Full User Hash', () => {
  const cases: { user: StatsigUser; expected: string }[] = [
    { user: { userID: '' }, expected: '3036664088' },
    {
      user: { customIDs: { employeeID: 'an-employee', orgID: 'an-org' } },
      expected: '3616781063',
    },
    {
      user: {
        customIDs: { orgID: 'an-org', employeeID: 'an-employee' },
      },
      expected: '3616781063',
    },
    {
      user: {
        userID: 'a-user',
        custom: {
          a: 'a',
          b: 1,
          c: ['1', '12', '123'],
        },
      },
      expected: '3193315102',
    },
    {
      user: {
        userID: 'a-user',
        custom: {
          b: 1,
          c: ['1', '12', '123'],
          a: 'a',
        },
      },
      expected: '3193315102',
    },
    {
      user: {
        userID: 'a-user',
        custom: {
          b: 1,
          c: ['12', '1', '123'],
          a: 'a',
        },
      },
      expected: '3885580336',
    },
  ];

  test.each(cases)('hashing $user', ({ user, expected }) => {
    const hash = _getFullUserHash(user);
    expect(hash).toBe(expected);
  });
});
