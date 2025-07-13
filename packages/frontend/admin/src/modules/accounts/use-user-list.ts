import { useQuery } from '@affine/admin/use-query';
// import { listUsersQuery } from '@affine/graphql';

// Temporary placeholder to replace @affine/graphql imports
const listUsersQuery = {
  id: 'listUsers',
  query: 'query ListUsers($filter: UserFilterInput) { users(filter: $filter) { id name email features } usersCount }',
};

import { useState } from 'react';

export const useUserList = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const {
    data: { users, usersCount },
  } = useQuery({
    query: listUsersQuery,
    variables: {
      filter: {
        first: pagination.pageSize,
        skip: pagination.pageIndex * pagination.pageSize,
      },
    },
  });

  return {
    users,
    pagination,
    setPagination,
    usersCount,
  };
};
